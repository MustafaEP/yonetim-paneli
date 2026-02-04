import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DocumentsService } from '../../documents.service';
import { CreateDocumentTemplateDto } from '../../application/dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from '../../application/dto/update-document-template.dto';
import {
  GenerateDocumentDto,
  UploadMemberDocumentDto,
  ApproveDocumentDto,
  RejectDocumentDto,
} from '../../dto';
import { Permissions } from '../../../auth/decorators/permissions.decorator';
import { Permission } from '../../../auth/permission.enum';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../../../auth/decorators/current-user.decorator';
import { DocumentExceptionFilter } from '../filters/document-exception.filter';
import { DocumentValidationPipe } from '../pipes/document-validation.pipe';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
@UseFilters(DocumentExceptionFilter)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Şablonlar
  @Permissions(
    Permission.DOCUMENT_TEMPLATE_MANAGE,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Get('templates')
  @ApiOperation({ summary: 'Doküman şablonlarını listele' })
  @ApiResponse({ status: 200, description: 'Şablon listesi' })
  async findAllTemplates() {
    return this.documentsService.findAllTemplates();
  }

  @Permissions(Permission.DOCUMENT_TEMPLATE_MANAGE)
  @Get('templates/:id')
  @ApiOperation({ summary: 'Şablon detayı' })
  @ApiParam({ name: 'id', description: 'Şablon ID' })
  @ApiResponse({ status: 200, description: 'Şablon detayı' })
  @ApiResponse({ status: 404, description: 'Şablon bulunamadı' })
  async findTemplateById(@Param('id') id: string) {
    return this.documentsService.findTemplateById(id);
  }

  @Permissions(Permission.DOCUMENT_TEMPLATE_MANAGE)
  @Post('templates')
  @UsePipes(DocumentValidationPipe)
  @ApiOperation({ summary: 'Yeni şablon oluştur' })
  @ApiResponse({ status: 201, description: 'Şablon oluşturuldu' })
  async createTemplate(@Body() dto: CreateDocumentTemplateDto) {
    return this.documentsService.createTemplate(dto);
  }

  @Permissions(Permission.DOCUMENT_TEMPLATE_MANAGE)
  @Patch('templates/:id')
  @UsePipes(DocumentValidationPipe)
  @ApiOperation({ summary: 'Şablon güncelle' })
  @ApiParam({ name: 'id', description: 'Şablon ID' })
  @ApiResponse({ status: 200, description: 'Şablon güncellendi' })
  @ApiResponse({ status: 404, description: 'Şablon bulunamadı' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTemplateDto,
  ) {
    return this.documentsService.updateTemplate(id, dto);
  }

  @Permissions(Permission.DOCUMENT_TEMPLATE_MANAGE)
  @Delete('templates/:id')
  @ApiOperation({ summary: 'Şablon sil' })
  @ApiParam({ name: 'id', description: 'Şablon ID' })
  @ApiResponse({ status: 200, description: 'Şablon silindi' })
  @ApiResponse({ status: 404, description: 'Şablon bulunamadı' })
  async deleteTemplate(@Param('id') id: string) {
    return this.documentsService.deleteTemplate(id);
  }

  // Üye dokümanları
  @Permissions(
    Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Get('members/:memberId')
  @ApiOperation({ summary: 'Üye dokümanlarını listele' })
  @ApiParam({ name: 'memberId', description: 'Üye ID' })
  @ApiResponse({ status: 200, description: 'Doküman listesi' })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async findMemberDocuments(@Param('memberId') memberId: string) {
    return this.documentsService.findMemberDocuments(memberId);
  }

  // PDF oluştur
  @Permissions(Permission.DOCUMENT_GENERATE_PDF)
  @Post('generate')
  @ApiOperation({ summary: 'PDF doküman oluştur' })
  @ApiBody({ type: GenerateDocumentDto })
  @ApiResponse({ status: 201, description: 'PDF doküman oluşturuldu' })
  @ApiResponse({ status: 404, description: 'Şablon veya üye bulunamadı' })
  async generateDocument(
    @Body() dto: GenerateDocumentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.documentsService.generateDocument(dto, user.userId);
  }

  // Doküman yükle
  @Permissions(Permission.DOCUMENT_GENERATE_PDF)
  @Post('members/:memberId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Üye dokümanı yükle' })
  @ApiParam({ name: 'memberId', description: 'Üye ID' })
  @ApiBody({ type: UploadMemberDocumentDto })
  @ApiResponse({ status: 201, description: 'Doküman yüklendi' })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async uploadMemberDocument(
    @Param('memberId') memberId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: { documentType?: string; description?: string; fileName?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.documentsService.uploadMemberDocument(
      memberId,
      file,
      body.documentType || 'UPLOADED',
      body.description,
      user.userId,
      body.fileName,
    );
  }

  // PDF görüntüle (inline)
  @Permissions(
    Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Get('view/:documentId')
  @ApiOperation({ summary: 'PDF dokümanı görüntüle (inline)' })
  @ApiParam({ name: 'documentId', description: 'Doküman ID' })
  @ApiResponse({ status: 200, description: 'Dosya görüntüleniyor' })
  @ApiResponse({ status: 404, description: 'Doküman bulunamadı' })
  async viewDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    await this.documentsService.viewDocument(documentId, res);
  }

  // PDF indir
  @Permissions(
    Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Get('download/:documentId')
  @ApiOperation({ summary: 'PDF dokümanı indir' })
  @ApiParam({ name: 'documentId', description: 'Doküman ID' })
  @ApiResponse({ status: 200, description: 'Dosya indiriliyor' })
  @ApiResponse({ status: 404, description: 'Doküman bulunamadı' })
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    await this.documentsService.downloadDocument(documentId, res);
  }

  // Admin: İnceleme bekleyen dokümanları getir
  @Permissions(
    Permission.DOCUMENT_TEMPLATE_MANAGE,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Get('pending-review')
  @ApiOperation({ summary: 'İnceleme bekleyen dokümanları listele (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'İnceleme bekleyen doküman listesi',
  })
  async getPendingReviewDocuments() {
    return this.documentsService.getPendingReviewDocuments();
  }

  // Admin: Dokümanı onayla
  @Permissions(
    Permission.DOCUMENT_TEMPLATE_MANAGE,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Post(':documentId/approve')
  @ApiOperation({ summary: 'Dokümanı onayla (Admin)' })
  @ApiParam({ name: 'documentId', description: 'Doküman ID' })
  @ApiBody({ type: ApproveDocumentDto })
  @ApiResponse({ status: 200, description: 'Doküman onaylandı' })
  @ApiResponse({ status: 404, description: 'Doküman bulunamadı' })
  @ApiResponse({ status: 400, description: 'Doküman onaylanamaz durumda' })
  async approveDocument(
    @Param('documentId') documentId: string,
    @Body() dto: ApproveDocumentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.documentsService.approveDocument(
      documentId,
      user.userId,
      dto.adminNote,
    );
  }

  // Admin: Dokümanı reddet
  @Permissions(
    Permission.DOCUMENT_TEMPLATE_MANAGE,
    Permission.DOCUMENT_GENERATE_PDF,
  )
  @Post(':documentId/reject')
  @ApiOperation({ summary: 'Dokümanı reddet (Admin)' })
  @ApiParam({ name: 'documentId', description: 'Doküman ID' })
  @ApiBody({ type: RejectDocumentDto })
  @ApiResponse({ status: 200, description: 'Doküman reddedildi' })
  @ApiResponse({ status: 404, description: 'Doküman bulunamadı' })
  @ApiResponse({
    status: 400,
    description: 'Doküman reddedilemez durumda veya red nedeni eksik',
  })
  async rejectDocument(
    @Param('documentId') documentId: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.documentsService.rejectDocument(
      documentId,
      user.userId,
      dto.rejectionReason,
    );
  }
}
