import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto';
import { NotificationStatus, NotificationTargetType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    status?: NotificationStatus;
    targetType?: NotificationTargetType;
    limit?: number;
    offset?: number;
  }) {
    const { limit = 25, offset = 0, status, targetType } = params || {};

    const where: any = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          sentByUser: {
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
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        sentByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı');
    }

    return notification;
  }

  async create(dto: CreateNotificationDto, userId: string) {
    return this.prisma.notification.create({
      data: {
        ...dto,
        sentBy: userId,
        status: NotificationStatus.PENDING,
      },
      include: {
        sentByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async send(id: string) {
    const notification = await this.findOne(id);

    // Burada gerçek bildirim gönderme mantığı olacak
    // Şimdilik sadece durumu güncelliyoruz
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        recipientCount: 100, // Örnek değer
        successCount: 95, // Örnek değer
        failedCount: 5, // Örnek değer
      },
      include: {
        sentByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.notification.delete({ where: { id } });
  }
}

