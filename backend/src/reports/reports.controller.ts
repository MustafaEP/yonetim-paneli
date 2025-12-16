import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Permissions(Permission.REPORT_GLOBAL_VIEW)
  @Get('global')
  @ApiOperation({ summary: 'Genel rapor' })
  @ApiResponse({ status: 200 })
  async getGlobalReport(@CurrentUser() user?: CurrentUserData) {
    return this.reportsService.getGlobalReport(user);
  }

  @Permissions(Permission.REPORT_REGION_VIEW)
  @Get('region')
  @ApiOperation({ summary: 'Bölge raporu' })
  @ApiResponse({ status: 200 })
  async getRegionReport(
    @Query('regionId') regionId?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.reportsService.getRegionReport(regionId, user);
  }

  @Permissions(Permission.REPORT_MEMBER_STATUS_VIEW)
  @Get('member-status')
  @ApiOperation({ summary: 'Üye durum raporu' })
  @ApiResponse({ status: 200 })
  async getMemberStatusReport(@CurrentUser() user?: CurrentUserData) {
    return this.reportsService.getMemberStatusReport(user);
  }

  @Permissions(Permission.REPORT_DUES_VIEW)
  @Get('dues')
  @ApiOperation({ summary: 'Aidat raporu' })
  @ApiResponse({ status: 200 })
  async getDuesReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const params = {
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    };
    return this.reportsService.getDuesReport(user, params);
  }
}

