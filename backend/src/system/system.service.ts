import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto';
import { SystemSettingCategory } from '@prisma/client';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.systemSetting.create({
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async updateSetting(key: string, dto: UpdateSystemSettingDto, userId: string) {
    await this.getSetting(key);

    return this.prisma.systemSetting.update({
      where: { key },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
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
  }) {
    const { limit = 25, offset = 0, userId, entityType, action } = params || {};

    const where: any = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

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
      data: logs,
      total,
      limit,
      offset,
    };
  }

  async createLog(data: {
    action: string;
    entityType: string;
    entityId?: string;
    userId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.systemLog.create({
      data,
    });
  }
}

