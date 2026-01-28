import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { MembersModule } from '../members/members.module';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationQueue, NOTIFICATION_QUEUE_NAME } from './queues/notification.queue';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { ConfigService } from '../config/config.service';
import { NotificationApplicationService } from './application/services/notification-application.service';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { NotificationRepository } from './domain/repositories/notification.repository.interface';
import { NotificationExceptionFilter } from './presentation/filters/notification-exception.filter';
import { NotificationValidationPipe } from './presentation/pipes/notification-validation.pipe';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    MembersModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.redisHost,
          port: configService.redisPort,
          password: configService.redisPassword,
          maxRetriesPerRequest: null, // BullMQ requires this to be null
          retryStrategy: (times) => {
            // Exponential backoff with max delay
            const delay = Math.min(times * 50, 5000);
            return delay;
          },
          enableOfflineQueue: false, // Redis yoksa job'ları queue'ya ekleme
        },
      }),
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationProcessor,
    NotificationQueue,
    EmailService,
    SmsService,
    NotificationApplicationService,
    {
      provide: 'NotificationRepository',
      useClass: PrismaNotificationRepository,
    },
    PrismaNotificationRepository,
    NotificationExceptionFilter,
    NotificationValidationPipe,
  ],
  exports: [
    NotificationsService,
    NotificationQueue,
  ],
})
export class NotificationsModule {}

