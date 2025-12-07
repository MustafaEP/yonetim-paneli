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
import { DuesService } from './dues.service';
import { CreateDuesPlanDto, UpdateDuesPlanDto, CreateDuesPaymentDto } from './dto';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('dues')
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  // ---------- PLANLAR ----------

  @Permissions(Permission.DUES_REPORT_VIEW, Permission.DUES_PLAN_MANAGE)
  @Get('plans')
  async getPlans(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.duesService.listPlans(include);
  }

  @Permissions(Permission.DUES_PLAN_MANAGE)
  @Post('plans')
  async createPlan(@Body() dto: CreateDuesPlanDto) {
    return this.duesService.createPlan(dto);
  }

  @Permissions(Permission.DUES_PLAN_MANAGE)
  @Put('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateDuesPlanDto,
  ) {
    return this.duesService.updatePlan(id, dto);
  }

  @Permissions(Permission.DUES_PLAN_MANAGE)
  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    return this.duesService.softDeletePlan(id);
  }

  // ---------- ÖDEMELER ----------

  @Permissions(Permission.DUES_PAYMENT_ADD)
  @Post('payments')
  async createPayment(
    @Body() dto: CreateDuesPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.duesService.createPayment(dto, user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW)
  @Get('members/:memberId/payments')
  async getMemberPayments(
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.duesService.getPaymentsForMember(memberId, user);
  }

  @Permissions(Permission.DUES_REPORT_VIEW)
  @Get('reports/summary')
  async getPaymentsSummary(@CurrentUser() user: CurrentUserData) {
    return this.duesService.getPaymentsSummary(user);
  }

  @Permissions(Permission.DUES_DEBT_LIST_VIEW)
  @Get('reports/debts')
  async getOverdueMembers(
    @Query('since') since: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const date = since ? new Date(since) : new Date(new Date().setMonth(new Date().getMonth() - 3));
    // default: son 3 ay ödeme yapmayanları getir

    return this.duesService.getOverdueMembers(date, user);
  }
}
