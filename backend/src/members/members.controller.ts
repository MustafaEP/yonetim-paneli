import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberApplicationDto } from './dto/create-member-application.dto';
import { CancelMemberDto } from './dto/cancel-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Permissions(Permission.MEMBER_CREATE_APPLICATION)
  @Get('check-national-id/:nationalId')
  @ApiOperation({ summary: 'TC kimlik numarasına göre iptal edilmiş üye kontrolü', description: 'Belirtilen TC kimlik numarasına sahip iptal edilmiş üye var mı kontrol eder' })
  @ApiParam({ name: 'nationalId', description: 'TC Kimlik Numarası' })
  @ApiResponse({
    status: 200,
    description: 'İptal edilmiş üye bilgisi (varsa)',
  })
  async checkNationalId(
    @Param('nationalId') nationalId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const cancelledMember = await this.membersService.checkCancelledMemberByNationalId(nationalId, user);
    return cancelledMember;
  }

  @Permissions(Permission.MEMBER_CREATE_APPLICATION)
  @Post('applications')
  @ApiOperation({ summary: 'Yeni üyelik başvurusu oluştur', description: 'Yeni bir üyelik başvurusu kaydı oluşturur' })
  @ApiBody({ type: CreateMemberApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Başvuru başarıyla oluşturuldu',
  })
  async createApplication(
    @Body() dto: CreateMemberApplicationDto & { previousCancelledMemberId?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    const member = await this.membersService.createApplication(
      dto,
      user.userId,
      dto.previousCancelledMemberId,
      user,
    );
    return member;
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_APPROVE, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('applications')
  @ApiOperation({ summary: 'Bekleyen üyelik başvurularını listele', description: 'Kullanıcının yetkisi dahilindeki PENDING durumundaki başvuruları listeler. MEMBER_LIST_BY_PROVINCE izni varsa sadece role\'deki il/ilçe bazlı başvuruları gösterir' })
  @ApiResponse({
    status: 200,
    description: 'Başvuru listesi',
    type: 'array',
  })
  async listApplications(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listApplicationsForUser(user);
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get()
  @ApiOperation({ summary: 'Üyeleri listele', description: 'Kullanıcının yetkisi dahilindeki tüm üyeleri listeler (durumu farketmeksizin). MEMBER_LIST_BY_PROVINCE izni varsa sadece role\'deki il/ilçe bazlı üyeleri gösterir' })
  @ApiResponse({
    status: 200,
    description: 'Üye listesi',
    type: 'array',
  })
  async listMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listMembersForUser(user);
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('rejected')
  @ApiOperation({ summary: 'Reddedilen üyeleri listele', description: 'Kullanıcının yetkisi dahilindeki reddedilen üyeleri listeler. MEMBER_LIST_BY_PROVINCE izni varsa sadece role\'deki il/ilçe bazlı reddedilen üyeleri gösterir' })
  @ApiResponse({
    status: 200,
    description: 'Reddedilen üye listesi',
    type: 'array',
  })
  async listRejectedMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listRejectedMembersForUser(user);
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('cancelled')
  @ApiOperation({ summary: 'İptal edilen üyeleri listele', description: 'Üyeliği iptal edilmiş üyeleri listeler. MEMBER_LIST_BY_PROVINCE izni varsa sadece role\'deki il/ilçe bazlı iptal edilen üyeleri gösterir' })
  @ApiResponse({ status: 200, description: 'İptal edilen üyeler listesi' })
  async listCancelledMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listCancelledMembersForUser(user);
  }


  @Permissions(Permission.MEMBER_VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Üye detayını getir', description: 'ID ile üye bilgilerini getirir' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Üye bilgileri',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async getById(@Param('id') id: string) {
    return this.membersService.getById(id);
  }

  @Permissions(Permission.MEMBER_APPROVE)
  @Post(':id/approve')
  @ApiOperation({ summary: 'Üyelik başvurusunu onayla', description: 'PENDING durumundaki başvuruyu ACTIVE yapar' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Başvuru onaylandı',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.membersService.approve(id, user.userId);
  }

  @Permissions(Permission.MEMBER_REJECT)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Üyelik başvurusunu reddet', description: 'PENDING durumundaki başvuruyu REJECTED yapar' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Başvuru reddedildi',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.membersService.reject(id, user.userId);
  }

  @Permissions(Permission.MEMBER_STATUS_CHANGE)
  @Delete(':id')
  @ApiOperation({ summary: 'Üyeyi sil', description: 'Üyeyi soft delete yapar' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Üye silindi',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async softDelete(@Param('id') id: string) {
    return this.membersService.softDelete(id);
  }

  @Permissions(Permission.MEMBER_STATUS_CHANGE)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Üyeliği iptal et', description: 'Aktif bir üyenin üyeliğini iptal eder' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiBody({ type: CancelMemberDto })
  @ApiResponse({ status: 200, description: 'Üyelik başarıyla iptal edildi' })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz işlem' })
  async cancelMembership(
    @Param('id') id: string,
    @Body() dto: CancelMemberDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.membersService.cancelMembership(id, dto, user.userId);
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Üye bilgilerini güncelle', description: 'Üye bilgilerini günceller ve geçmişe kaydeder' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiBody({ type: UpdateMemberDto })
  @ApiResponse({ status: 200, description: 'Üye bilgileri güncellendi' })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    // TODO: IP adresi ve user agent bilgisini request'ten al
    return this.membersService.updateMember(id, dto, user.userId);
  }

  @Permissions(Permission.MEMBER_VIEW)
  @Get(':id/history')
  @ApiOperation({ summary: 'Üye güncelleme geçmişini getir' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({ status: 200, description: 'Üye güncelleme geçmişi' })
  async getMemberHistory(@Param('id') id: string) {
    return this.membersService.getMemberHistory(id);
  }
}
