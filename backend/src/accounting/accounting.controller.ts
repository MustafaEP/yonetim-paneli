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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { UploadTevkifatFileDto } from './dto/upload-tevkifat-file.dto';
import { CreateTevkifatCenterDto } from './dto/create-tevkifat-center.dto';
import { UpdateTevkifatCenterDto } from './dto/update-tevkifat-center.dto';
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
  @ApiResponse({ status: 200, description: 'Tevkifat merkezleri listesi' })
  async listTevkifatCenters() {
    return this.accountingService.listTevkifatCenters();
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
  @ApiOperation({ summary: 'Tevkifat merkezi sil (pasif yap)' })
  @ApiParam({ name: 'id', description: 'Tevkifat merkezi ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezi pasif yapıldı' })
  @ApiResponse({ status: 404, description: 'Tevkifat merkezi bulunamadı' })
  async deleteTevkifatCenter(@Param('id') id: string) {
    return this.accountingService.deleteTevkifatCenter(id);
  }
}
