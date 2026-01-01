import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { UploadTevkifatFileDto } from './dto/upload-tevkifat-file.dto';
import { CreateTevkifatCenterDto } from './dto/create-tevkifat-center.dto';
import { UpdateTevkifatCenterDto } from './dto/update-tevkifat-center.dto';
import { DeleteTevkifatCenterDto } from './dto/delete-tevkifat-center.dto';
import { CreateTevkifatTitleDto } from './dto/create-tevkifat-title.dto';
import { UpdateTevkifatTitleDto } from './dto/update-tevkifat-title.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { ApprovalStatus } from '@prisma/client';

@ApiTags('Accounting')
@ApiBearerAuth('JWT-auth')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('members')
  @ApiOperation({ summary: 'Muhasebe üyeleri listele', description: 'Excel/PDF export için üye listesi' })
  @ApiResponse({ status: 200, description: 'Üye listesi' })
  async getMembers(
    @Query('branchId') branchId?: string,
    @Query('tevkifatCenterId') tevkifatCenterId?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.accountingService.getMembersForAccounting({
      branchId,
      tevkifatCenterId,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
    });
  }

  @Permissions(Permission.TEVKIFAT_FILE_UPLOAD)
  @Post('tevkifat-files')
  @ApiOperation({ summary: 'Tevkifat dosyası yükle', description: 'PDF dosya yükleme (admin onayı bekler)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadTevkifatFileDto })
  @ApiResponse({ status: 201, description: 'Dosya yüklendi (onay bekliyor)' })
  async uploadTevkifatFile(
    @Body() dto: UploadTevkifatFileDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    // TODO: File upload işlemi burada yapılacak (multer ile)
    // Şimdilik dto'da fileUrl olarak gönderiliyor
    return this.accountingService.uploadTevkifatFile(dto, user.userId);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-files')
  @ApiOperation({ summary: 'Tevkifat dosyalarını listele', description: 'Ay ve yıl bazlı listeleme' })
  @ApiResponse({ status: 200, description: 'Tevkifat dosya listesi' })
  async listTevkifatFiles(
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('tevkifatCenterId') tevkifatCenterId?: string,
    @Query('status') status?: ApprovalStatus,
  ) {
    return this.accountingService.listTevkifatFiles({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      tevkifatCenterId,
      status,
    });
  }

  @Permissions(Permission.TEVKIFAT_FILE_APPROVE)
  @Post('tevkifat-files/:id/approve')
  @ApiOperation({ summary: 'Tevkifat dosyasını onayla' })
  @ApiResponse({ status: 200, description: 'Dosya onaylandı' })
  async approveTevkifatFile(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.accountingService.approveTevkifatFile(id, user.userId);
  }

  @Permissions(Permission.TEVKIFAT_FILE_APPROVE)
  @Post('tevkifat-files/:id/reject')
  @ApiOperation({ summary: 'Tevkifat dosyasını reddet' })
  @ApiResponse({ status: 200, description: 'Dosya reddedildi' })
  async rejectTevkifatFile(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.accountingService.rejectTevkifatFile(id, user.userId);
  }

  // Tevkifat Merkezleri CRUD
  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-centers')
  @ApiOperation({ summary: 'Tevkifat merkezlerini listele' })
  @ApiQuery({ name: 'provinceId', required: false, description: 'İl ID (filtreleme için - o ile bağlı olanları ve o ilin ilçelerine bağlı olanları gösterir)' })
  @ApiQuery({ name: 'districtId', required: false, description: 'İlçe ID (filtreleme için)' })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezleri listesi' })
  async listTevkifatCenters(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.accountingService.listTevkifatCenters({ provinceId, districtId });
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-centers/:id')
  @ApiOperation({ summary: 'Tevkifat merkezi detayını getir' })
  @ApiParam({ name: 'id', description: 'Tevkifat merkezi ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezi detayı' })
  @ApiResponse({ status: 404, description: 'Tevkifat merkezi bulunamadı' })
  async getTevkifatCenterById(@Param('id') id: string) {
    return this.accountingService.getTevkifatCenterById(id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Post('tevkifat-centers')
  @ApiOperation({ summary: 'Tevkifat merkezi oluştur' })
  @ApiBody({ type: CreateTevkifatCenterDto })
  @ApiResponse({ status: 201, description: 'Tevkifat merkezi oluşturuldu' })
  async createTevkifatCenter(@Body() dto: CreateTevkifatCenterDto) {
    return this.accountingService.createTevkifatCenter(dto);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Patch('tevkifat-centers/:id')
  @ApiOperation({ summary: 'Tevkifat merkezi güncelle' })
  @ApiParam({ name: 'id', description: 'Tevkifat merkezi ID' })
  @ApiBody({ type: UpdateTevkifatCenterDto })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezi güncellendi' })
  @ApiResponse({ status: 404, description: 'Tevkifat merkezi bulunamadı' })
  async updateTevkifatCenter(
    @Param('id') id: string,
    @Body() dto: UpdateTevkifatCenterDto,
  ) {
    return this.accountingService.updateTevkifatCenter(id, dto);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Delete('tevkifat-centers/:id')
  @ApiOperation({ 
    summary: 'Tevkifat merkezi sil (pasif yap)', 
    description: 'Mevcut tevkifat merkezini pasif yapar. Üyelere ne yapılacağını belirtmek için body içinde memberActionType ve targetTevkifatCenterId gönderilmelidir.' 
  })
  @ApiParam({ name: 'id', description: 'Tevkifat merkezi ID' })
  @ApiBody({ type: DeleteTevkifatCenterDto })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezi pasif yapıldı' })
  @ApiResponse({ status: 404, description: 'Tevkifat merkezi veya hedef tevkifat merkezi bulunamadı' })
  async deleteTevkifatCenter(@Param('id') id: string, @Body() dto: DeleteTevkifatCenterDto) {
    return this.accountingService.deleteTevkifatCenter(id, dto);
  }

  // Tevkifat Unvanları CRUD
  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-titles')
  @ApiOperation({ summary: 'Tevkifat unvanlarını listele' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanları listesi' })
  async listTevkifatTitles() {
    return this.accountingService.listTevkifatTitles();
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-titles/:id')
  @ApiOperation({ summary: 'Tevkifat unvanı detayını getir' })
  @ApiParam({ name: 'id', description: 'Tevkifat unvanı ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanı detayı' })
  @ApiResponse({ status: 404, description: 'Tevkifat unvanı bulunamadı' })
  async getTevkifatTitleById(@Param('id') id: string) {
    return this.accountingService.getTevkifatTitleById(id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Post('tevkifat-titles')
  @ApiOperation({ summary: 'Tevkifat unvanı oluştur' })
  @ApiBody({ type: CreateTevkifatTitleDto })
  @ApiResponse({ status: 201, description: 'Tevkifat unvanı oluşturuldu' })
  async createTevkifatTitle(@Body() dto: CreateTevkifatTitleDto) {
    return this.accountingService.createTevkifatTitle(dto);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Patch('tevkifat-titles/:id')
  @ApiOperation({ summary: 'Tevkifat unvanı güncelle' })
  @ApiParam({ name: 'id', description: 'Tevkifat unvanı ID' })
  @ApiBody({ type: UpdateTevkifatTitleDto })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanı güncellendi' })
  @ApiResponse({ status: 404, description: 'Tevkifat unvanı bulunamadı' })
  async updateTevkifatTitle(
    @Param('id') id: string,
    @Body() dto: UpdateTevkifatTitleDto,
  ) {
    return this.accountingService.updateTevkifatTitle(id, dto);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Delete('tevkifat-titles/:id')
  @ApiOperation({ summary: 'Tevkifat unvanı sil (kalıcı silme)' })
  @ApiParam({ name: 'id', description: 'Tevkifat unvanı ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanı silindi' })
  @ApiResponse({ status: 404, description: 'Tevkifat unvanı bulunamadı' })
  async deleteTevkifatTitle(@Param('id') id: string) {
    return this.accountingService.deleteTevkifatTitle(id);
  }
}
