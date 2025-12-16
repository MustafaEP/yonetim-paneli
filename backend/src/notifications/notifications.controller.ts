import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { NotificationStatus, NotificationTargetType } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Permissions(
    Permission.NOTIFY_ALL_MEMBERS,
    Permission.NOTIFY_REGION,
    Permission.NOTIFY_OWN_SCOPE,
  )
  @Get()
  @ApiOperation({ summary: 'Bildirimleri listele' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query('status') status?: NotificationStatus,
    @Query('targetType') targetType?: NotificationTargetType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationsService.findAll({
      status,
      targetType,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Permissions(
    Permission.NOTIFY_ALL_MEMBERS,
    Permission.NOTIFY_REGION,
    Permission.NOTIFY_OWN_SCOPE,
  )
  @Get(':id')
  @ApiOperation({ summary: 'Bildirim detayı' })
  @ApiResponse({ status: 200 })
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Permissions(
    Permission.NOTIFY_ALL_MEMBERS,
    Permission.NOTIFY_REGION,
    Permission.NOTIFY_OWN_SCOPE,
  )
  @Post()
  @ApiOperation({ summary: 'Yeni bildirim oluştur' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationsService.create(dto, user.userId);
  }

  @Permissions(
    Permission.NOTIFY_ALL_MEMBERS,
    Permission.NOTIFY_REGION,
    Permission.NOTIFY_OWN_SCOPE,
  )
  @Post(':id/send')
  @ApiOperation({ summary: 'Bildirimi gönder' })
  @ApiResponse({ status: 200 })
  async send(@Param('id') id: string) {
    return this.notificationsService.send(id);
  }

  @Permissions(
    Permission.NOTIFY_ALL_MEMBERS,
    Permission.NOTIFY_REGION,
    Permission.NOTIFY_OWN_SCOPE,
  )
  @Delete(':id')
  @ApiOperation({ summary: 'Bildirimi sil' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}

