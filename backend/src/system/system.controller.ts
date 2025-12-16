import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { SystemSettingCategory } from '@prisma/client';

@ApiTags('System')
@ApiBearerAuth('JWT-auth')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // Settings
  @Permissions(Permission.SYSTEM_SETTINGS_VIEW)
  @Get('settings')
  @ApiOperation({ summary: 'Sistem ayarlarını listele' })
  @ApiResponse({ status: 200 })
  async getSettings(@Query('category') category?: SystemSettingCategory) {
    return this.systemService.getSettings(category);
  }

  @Permissions(Permission.SYSTEM_SETTINGS_VIEW)
  @Get('settings/:key')
  @ApiOperation({ summary: 'Sistem ayarı detayı' })
  @ApiResponse({ status: 200 })
  async getSetting(@Param('key') key: string) {
    return this.systemService.getSetting(key);
  }

  @Permissions(Permission.SYSTEM_SETTINGS_MANAGE)
  @Post('settings')
  @ApiOperation({ summary: 'Yeni sistem ayarı oluştur' })
  @ApiResponse({ status: 201 })
  async createSetting(
    @Body() dto: CreateSystemSettingDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.systemService.createSetting(dto, user.userId);
  }

  @Permissions(Permission.SYSTEM_SETTINGS_MANAGE)
  @Patch('settings/:key')
  @ApiOperation({ summary: 'Sistem ayarını güncelle' })
  @ApiResponse({ status: 200 })
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.systemService.updateSetting(key, dto, user.userId);
  }

  @Permissions(Permission.SYSTEM_SETTINGS_MANAGE)
  @Delete('settings/:key')
  @ApiOperation({ summary: 'Sistem ayarını sil' })
  @ApiResponse({ status: 200 })
  async deleteSetting(@Param('key') key: string) {
    return this.systemService.deleteSetting(key);
  }

  // Logs
  @Permissions(Permission.LOG_VIEW_ALL, Permission.LOG_VIEW_OWN_SCOPE)
  @Get('logs')
  @ApiOperation({ summary: 'Sistem loglarını listele' })
  @ApiResponse({ status: 200 })
  async getLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    // Eğer sadece LOG_VIEW_OWN_SCOPE izni varsa, sadece kendi loglarını göster
    const hasViewAll = user?.permissions?.includes(Permission.LOG_VIEW_ALL);
    const finalUserId = hasViewAll ? userId : user?.userId;

    return this.systemService.getLogs({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      userId: finalUserId,
      entityType,
      action,
    });
  }
}

