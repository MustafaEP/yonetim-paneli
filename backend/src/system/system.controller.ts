import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { SystemSettingCategory } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // Public endpoint - Logo ve sistem adı için
  @Public()
  @Get('public-info')
  @ApiOperation({ summary: 'Public sistem bilgileri (logo ve sistem adı)' })
  @ApiResponse({ status: 200 })
  async getPublicInfo() {
    return this.systemService.getPublicInfo();
  }

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
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    // Eğer sadece LOG_VIEW_OWN_SCOPE izni varsa, scope bazlı filtreleme yapılacak
    const hasViewAll = user?.permissions?.includes(Permission.LOG_VIEW_ALL);
    const finalUserId = hasViewAll ? userId : user?.userId;

    return this.systemService.getLogs({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      userId: finalUserId,
      entityType,
      action,
      startDate,
      endDate,
      user, // Scope filtreleme için user bilgisini gönder
    });
  }

  @Permissions(Permission.LOG_VIEW_ALL, Permission.LOG_VIEW_OWN_SCOPE)
  @Get('logs/:id')
  @ApiOperation({ summary: 'Sistem log detayı' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Log bulunamadı' })
  async getLogById(
    @Param('id') id: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.systemService.getLogById(id, user);
  }

  // Logo yükleme
  @Permissions(Permission.SYSTEM_SETTINGS_MANAGE)
  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'logos');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `logo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg|webp)$/)) {
          return cb(new BadRequestException('Sadece resim dosyaları yüklenebilir'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Logo yükle' })
  @ApiResponse({ status: 201, description: 'Logo başarıyla yüklendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz dosya' })
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi');
    }

    const logoUrl = `/uploads/logos/${file.filename}`;
    return { url: logoUrl };
  }

  // Antetli kağıt yükleme (PNG/JPG öneriliyor - daha hızlı)
  @Permissions(Permission.SYSTEM_SETTINGS_MANAGE)
  @Post('upload-header-paper')
  @UseInterceptors(
    FileInterceptor('headerPaper', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'header-paper');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Dosya uzantısını koru
          const ext = extname(file.originalname);
          cb(null, `yonetim_paneli_antetli_kagit${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // PDF, PNG, JPG kabul et
        if (!file.mimetype.match(/\/(pdf|png|jpg|jpeg)$/)) {
          return cb(new BadRequestException('Sadece PDF, PNG veya JPG dosyaları yüklenebilir'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        headerPaper: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Antetli kağıt yükle (PNG/JPG öneriliyor)' })
  @ApiResponse({ status: 201, description: 'Antetli kağıt başarıyla yüklendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz dosya' })
  async uploadHeaderPaper(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi');
    }

    const headerPaperUrl = `/uploads/header-paper/${file.filename}`;
    return { url: headerPaperUrl };
  }
}

