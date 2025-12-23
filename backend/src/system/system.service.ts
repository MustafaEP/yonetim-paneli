import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto';
import { SystemSettingCategory } from '@prisma/client';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ConfigService))
    private configService: ConfigService,
  ) {}

  // System Settings
  async getSettings(category?: SystemSettingCategory) {
    return this.prisma.systemSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: { category: 'asc' },
    });
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException('Ayar bulunamadı');
    }

    return setting;
  }

  async createSetting(dto: CreateSystemSettingDto, userId: string) {
    const created = await this.prisma.systemSetting.create({
      data: {
        ...dto,
        updatedBy: userId,
      },
    });

    // ConfigService cache'ini invalidate et
    await this.configService.invalidateSettingsCache(dto.key);

    return created;
  }

  async updateSetting(key: string, dto: UpdateSystemSettingDto, userId: string) {
    const oldSetting = await this.getSetting(key);

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // ConfigService cache'ini invalidate et
    await this.configService.invalidateSettingsCache(key);

    // Audit log oluştur
    try {
      await this.createLog({
        action: 'SETTING_UPDATE',
        entityType: 'SYSTEM_SETTING',
        entityId: key,
        userId,
        details: {
          key,
          category: oldSetting.category,
          oldValue: oldSetting.value,
          newValue: updated.value,
          description: oldSetting.description,
        },
      });
    } catch (error) {
      // Log kaydı başarısız olsa bile işlemi durdurma
      console.error('Ayar değişikliği log kaydı oluşturulamadı:', error);
    }

    return updated;
  }

  async deleteSetting(key: string) {
    await this.getSetting(key);
    return this.prisma.systemSetting.delete({ where: { key } });
  }

  // System Logs
  async getLogs(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { limit = 25, offset = 0, userId, entityType, action, startDate, endDate } = params || {};

    const where: any = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    
    // Tarih filtreleri
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Bitiş tarihini günün sonuna kadar almak için
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      logs,
      total,
    };
  }

  async getLogById(id: string) {
    const log = await this.prisma.systemLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Log bulunamadı');
    }

    return log;
  }

  async createLog(data: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string; // Nullable - başarısız login gibi durumlar için
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.systemLog.create({
      data,
    });
  }
}

