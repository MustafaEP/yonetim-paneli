import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { DuesService } from './dues.service';
import { CreateDuesPlanDto, UpdateDuesPlanDto, CreateDuesPaymentDto } from './dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Dues')
@ApiBearerAuth('JWT-auth')
@Controller('dues')
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  // ---------- PLANLAR ----------

  @Permissions(Permission.DUES_REPORT_VIEW, Permission.DUES_PLAN_MANAGE)
  @Get('plans')
  @ApiOperation({ summary: 'Aidat planlarını listele', description: 'Aktif veya tüm aidat planlarını listeler' })
  @ApiQuery({ name: 'includeInactive', required: false, description: 'Pasif planları da dahil et', example: 'true', type: Boolean })
  @ApiResponse({ status: 200, description: 'Aidat plan listesi', type: 'array' })
  async getPlans(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.duesService.listPlans(include);
  }

  @Permissions(Permission.DUES_PLAN_MANAGE)
  @Post('plans')
  @ApiOperation({ summary: 'Yeni aidat planı oluştur', description: 'Yeni bir aidat planı kaydı oluşturur' })
  @ApiBody({ type: CreateDuesPlanDto })
  @ApiResponse({ status: 201, description: 'Aidat planı başarıyla oluşturuldu' })
  async createPlan(@Body() dto: CreateDuesPlanDto) {
    return this.duesService.createPlan(dto);
  }

  @Permissions(Permission.DUES_PLAN_MANAGE)
  @Put('plans/:id')
  @ApiOperation({ summary: 'Aidat planını güncelle', description: 'Mevcut aidat planı bilgilerini günceller' })
  @ApiParam({ name: 'id', description: 'Aidat planı ID', example: 'plan-uuid-456' })
  @ApiBody({ type: UpdateDuesPlanDto })
  @ApiResponse({ status: 200, description: 'Aidat planı başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Aidat planı bulunamadı' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateDuesPlanDto,
  ) {
    return this.duesService.updatePlan(id, dto);
  }

  @Permissions(Permission.DUES_PLAN_MANAGE)
  @Delete('plans/:id')
  @ApiOperation({ summary: 'Aidat planını sil', description: 'Aidat planını soft delete yapar' })
  @ApiParam({ name: 'id', description: 'Aidat planı ID', example: 'plan-uuid-456' })
  @ApiResponse({ status: 200, description: 'Aidat planı silindi' })
  @ApiResponse({ status: 404, description: 'Aidat planı bulunamadı' })
  async deletePlan(@Param('id') id: string) {
    return this.duesService.softDeletePlan(id);
  }

  // ---------- ÖDEMELER ----------

  @Permissions(Permission.DUES_PAYMENT_ADD)
  @Post('payments')
  @ApiOperation({ summary: 'Yeni aidat ödemesi kaydet', description: 'Üye için yeni bir aidat ödemesi kaydı oluşturur' })
  @ApiBody({ type: CreateDuesPaymentDto })
  @ApiResponse({ status: 201, description: 'Ödeme başarıyla kaydedildi' })
  async createPayment(
    @Body() dto: CreateDuesPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.duesService.createPayment(dto, user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW)
  @Get('members/:memberId/payments')
  @ApiOperation({ summary: 'Üye ödeme geçmişini getir', description: 'Belirli bir üyenin tüm aidat ödeme geçmişini listeler' })
  @ApiParam({ name: 'memberId', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({ status: 200, description: 'Ödeme geçmişi', type: 'array' })
  async getMemberPayments(
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.duesService.getPaymentsForMember(memberId, user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW)
  @Get('reports/summary')
  @ApiOperation({ summary: 'Dashboard özet raporu', description: 'Kullanıcının yetkisi dahilindeki üyelerin dashboard özetini getirir' })
  @ApiResponse({ status: 200, description: 'Dashboard özet raporu' })
  async getDuesSummary(@CurrentUser() user: CurrentUserData) {
    return this.duesService.getDuesSummary(user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW)
  @Get('reports/monthly')
  @ApiOperation({ summary: 'Aylık tahsilat raporu', description: 'Kullanıcının yetkisi dahilindeki tüm aylık tahsilat verilerini getirir' })
  @ApiResponse({ status: 200, description: 'Aylık tahsilat raporu', type: 'array' })
  async getMonthlyPaymentsReport(@CurrentUser() user: CurrentUserData) {
    return this.duesService.getMonthlyPaymentsReport(user);
  }

  @Permissions(Permission.DUES_DEBT_LIST_VIEW)
  @Get('reports/debts')
  @ApiOperation({ summary: 'Borçlu üyeler listesi', description: 'Belirli bir tarihten beri ödeme yapmayan üyeleri listeler' })
  @ApiQuery({ name: 'since', required: false, description: 'Başlangıç tarihi (ISO format)', example: '2024-01-01T00:00:00.000Z', type: String })
  @ApiResponse({ status: 200, description: 'Borçlu üyeler listesi', type: 'array' })
  async getOverdueMembers(
    @Query('since') since: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const date = since ? new Date(since) : new Date(new Date().setMonth(new Date().getMonth() - 3));
    // default: son 3 ay ödeme yapmayanları getir

    return this.duesService.getOverdueMembers(date, user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW, Permission.DUES_DEBT_LIST_VIEW)
  @Get('members/:memberId/debt')
  @ApiOperation({ summary: 'Üye borç bilgisi', description: 'Belirli bir üyenin borç bilgisini getirir' })
  @ApiParam({ name: 'memberId', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({ status: 200, description: 'Üye borç bilgisi' })
  async getMemberDebt(
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.duesService.getMemberDebt(memberId, user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW, Permission.DUES_DEBT_LIST_VIEW)
  @Get('members/:memberId/monthly-debts')
  @ApiOperation({ summary: 'Üye aylık borç durumu', description: 'Belirli bir üyenin her ay için borç durumunu getirir' })
  @ApiParam({ name: 'memberId', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiQuery({ name: 'year', required: false, description: 'Yıl (varsayılan: mevcut yıl)', type: Number })
  @ApiResponse({ status: 200, description: 'Aylık borç durumu' })
  async getMemberMonthlyDebts(
    @Param('memberId') memberId: string,
    @Query('year') year: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.duesService.getMemberMonthlyDebts(memberId, yearNum, user);
  }
}
