/**
 * Accounting Controller (Presentation Layer)
 * 
 * Moved from accounting.controller.ts to presentation/controllers/accounting.controller.ts
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TevkifatCenterApplicationService } from '../../application/services/tevkifat-center-application.service';
import { TevkifatTitleApplicationService } from '../../application/services/tevkifat-title-application.service';
import { TevkifatFileApplicationService } from '../../application/services/tevkifat-file-application.service';
import { AccountingService } from '../../accounting.service'; // Legacy service for backward compatibility
import { UploadTevkifatFileDto } from '../../dto/upload-tevkifat-file.dto';
import { CreateTevkifatCenterDto } from '../../dto/create-tevkifat-center.dto';
import { UpdateTevkifatCenterDto } from '../../dto/update-tevkifat-center.dto';
import { DeleteTevkifatCenterDto } from '../../dto/delete-tevkifat-center.dto';
import { CreateTevkifatTitleDto } from '../../dto/create-tevkifat-title.dto';
import { UpdateTevkifatTitleDto } from '../../dto/update-tevkifat-title.dto';
import { Permissions } from '../../../auth/decorators/permissions.decorator';
import { Permission } from '../../../auth/permission.enum';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../../../auth/decorators/current-user.decorator';
import { ApprovalStatus } from '@prisma/client';

@ApiTags('Accounting')
@ApiBearerAuth('JWT-auth')
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService, // Legacy service
    private readonly tevkifatCenterApplicationService: TevkifatCenterApplicationService,
    private readonly tevkifatTitleApplicationService: TevkifatTitleApplicationService,
    private readonly tevkifatFileApplicationService: TevkifatFileApplicationService,
  ) {}

  // Legacy endpoints - using legacy service for backward compatibility
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
  @ApiResponse({ status: 201, description: 'Dosya yüklendi (onay bekliyor)' })
  async uploadTevkifatFile(
    @Body() dto: UploadTevkifatFileDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.tevkifatFileApplicationService.uploadFile({
      tevkifatCenterId: dto.tevkifatCenterId,
      totalAmount: dto.totalAmount,
      memberCount: dto.memberCount,
      month: dto.month,
      year: dto.year,
      positionTitle: dto.positionTitle,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSize: dto.fileSize,
      uploadedBy: user.userId,
    });
    // Return Prisma format for backward compatibility
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
    // Using legacy service for now to maintain response format with relations
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
    await this.tevkifatFileApplicationService.approveFile(id, user.userId);
    // Return Prisma format for backward compatibility
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
    await this.tevkifatFileApplicationService.rejectFile(id);
    // Return Prisma format for backward compatibility
    return this.accountingService.rejectTevkifatFile(id, user.userId);
  }

  // Tevkifat Merkezleri CRUD - Using new application service
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
    const centers = await this.tevkifatCenterApplicationService.listCenters({ provinceId, districtId });
    // Map to response format (include counts, etc.)
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
  @ApiResponse({ status: 201, description: 'Tevkifat merkezi oluşturuldu' })
  async createTevkifatCenter(@Body() dto: CreateTevkifatCenterDto) {
    const center = await this.tevkifatCenterApplicationService.createCenter({
      name: dto.name,
      provinceId: dto.provinceId,
      districtId: dto.districtId,
    });
    // Return Prisma format for backward compatibility
    return this.accountingService.getTevkifatCenterById(center.id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Patch('tevkifat-centers/:id')
  @ApiOperation({ summary: 'Tevkifat merkezi güncelle' })
  @ApiParam({ name: 'id', description: 'Tevkifat merkezi ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezi güncellendi' })
  @ApiResponse({ status: 404, description: 'Tevkifat merkezi bulunamadı' })
  async updateTevkifatCenter(
    @Param('id') id: string,
    @Body() dto: UpdateTevkifatCenterDto,
  ) {
    const center = await this.tevkifatCenterApplicationService.updateCenter(id, {
      name: dto.name,
      provinceId: dto.provinceId,
      districtId: dto.districtId,
      isActive: dto.isActive,
    });
    // Return Prisma format for backward compatibility
    return this.accountingService.getTevkifatCenterById(center.id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Delete('tevkifat-centers/:id')
  @ApiOperation({ 
    summary: 'Tevkifat merkezi sil (pasif yap)', 
    description: 'Mevcut tevkifat merkezini pasif yapar. Üyelere ne yapılacağını belirtmek için body içinde memberActionType ve targetTevkifatCenterId gönderilmelidir.' 
  })
  @ApiParam({ name: 'id', description: 'Tevkifat merkezi ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat merkezi pasif yapıldı' })
  @ApiResponse({ status: 404, description: 'Tevkifat merkezi veya hedef tevkifat merkezi bulunamadı' })
  async deleteTevkifatCenter(@Param('id') id: string, @Body() dto: DeleteTevkifatCenterDto) {
    await this.tevkifatCenterApplicationService.deleteCenter(id, dto.memberActionType, dto.targetTevkifatCenterId);
    return this.accountingService.getTevkifatCenterById(id);
  }

  // Tevkifat Unvanları CRUD - Using new application service
  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-titles')
  @ApiOperation({ summary: 'Tevkifat unvanlarını listele' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanları listesi' })
  async listTevkifatTitles() {
    // Using legacy service for backward compatibility
    return this.accountingService.listTevkifatTitles();
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('tevkifat-titles/:id')
  @ApiOperation({ summary: 'Tevkifat unvanı detayını getir' })
  @ApiParam({ name: 'id', description: 'Tevkifat unvanı ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanı detayı' })
  @ApiResponse({ status: 404, description: 'Tevkifat unvanı bulunamadı' })
  async getTevkifatTitleById(@Param('id') id: string) {
    // Using legacy service for backward compatibility
    return this.accountingService.getTevkifatTitleById(id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Post('tevkifat-titles')
  @ApiOperation({ summary: 'Tevkifat unvanı oluştur' })
  @ApiResponse({ status: 201, description: 'Tevkifat unvanı oluşturuldu' })
  async createTevkifatTitle(@Body() dto: CreateTevkifatTitleDto) {
    await this.tevkifatTitleApplicationService.createTitle({ name: dto.name });
    // Return Prisma format for backward compatibility
    return this.accountingService.getTevkifatTitleById((await this.tevkifatTitleApplicationService.listTitles()).find(t => t.name === dto.name)!.id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Patch('tevkifat-titles/:id')
  @ApiOperation({ summary: 'Tevkifat unvanı güncelle' })
  @ApiParam({ name: 'id', description: 'Tevkifat unvanı ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanı güncellendi' })
  @ApiResponse({ status: 404, description: 'Tevkifat unvanı bulunamadı' })
  async updateTevkifatTitle(
    @Param('id') id: string,
    @Body() dto: UpdateTevkifatTitleDto,
  ) {
    await this.tevkifatTitleApplicationService.updateTitle(id, {
      name: dto.name,
      isActive: dto.isActive,
    });
    // Return Prisma format for backward compatibility
    return this.accountingService.getTevkifatTitleById(id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Delete('tevkifat-titles/:id')
  @ApiOperation({ summary: 'Tevkifat unvanı sil (kalıcı silme)' })
  @ApiParam({ name: 'id', description: 'Tevkifat unvanı ID' })
  @ApiResponse({ status: 200, description: 'Tevkifat unvanı silindi' })
  @ApiResponse({ status: 404, description: 'Tevkifat unvanı bulunamadı' })
  async deleteTevkifatTitle(@Param('id') id: string) {
    await this.tevkifatTitleApplicationService.deleteTitle(id);
    return { message: 'Tevkifat unvanı silindi' };
  }
}
