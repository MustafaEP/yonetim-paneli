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
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto } from './dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { ContentType, ContentStatus } from '@prisma/client';

@ApiTags('Content')
@ApiBearerAuth('JWT-auth')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Permissions(Permission.CONTENT_MANAGE)
  @Get()
  @ApiOperation({ summary: 'İçerikleri listele' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query('type') type?: ContentType,
    @Query('status') status?: ContentStatus,
  ) {
    return this.contentService.findAll({ type, status });
  }

  @Permissions(Permission.CONTENT_MANAGE)
  @Get(':id')
  @ApiOperation({ summary: 'İçerik detayı' })
  @ApiResponse({ status: 200 })
  async findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Permissions(Permission.CONTENT_MANAGE)
  @Post()
  @ApiOperation({ summary: 'Yeni içerik oluştur' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() createContentDto: CreateContentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.contentService.create(createContentDto, user.userId);
  }

  @Permissions(Permission.CONTENT_MANAGE)
  @Patch(':id')
  @ApiOperation({ summary: 'İçerik güncelle' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @Permissions(Permission.CONTENT_MANAGE)
  @Delete(':id')
  @ApiOperation({ summary: 'İçerik sil' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }

  @Permissions(Permission.CONTENT_PUBLISH)
  @Post(':id/publish')
  @ApiOperation({ summary: 'İçeriği yayınla' })
  @ApiResponse({ status: 200 })
  async publish(@Param('id') id: string) {
    return this.contentService.publish(id);
  }
}

