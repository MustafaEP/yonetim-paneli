import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationQueue, NOTIFICATION_QUEUE_NAME } from './queues/notification.queue';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
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
  ],
  exports: [
    NotificationsService,
    NotificationQueue,
  ],
})
export class NotificationsModule {}

