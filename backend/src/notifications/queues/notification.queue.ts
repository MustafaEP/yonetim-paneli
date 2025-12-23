import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '../../config/config.service';

export const NOTIFICATION_QUEUE_NAME = 'notifications';

@Injectable()
export class NotificationQueue extends Queue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueue.name);
  private isRedisAvailable = false;
  private lastErrorLogTime = 0;
  private readonly ERROR_LOG_INTERVAL = 30000; // 30 saniyede bir hata logla
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(configService: ConfigService) {
    super(NOTIFICATION_QUEUE_NAME, {
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
        // Bağlantı hatalarında daha az agresif retry
        enableOfflineQueue: false, // Redis yoksa job'ları queue'ya ekleme
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // 24 saat
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // 7 gün
        },
      },
    });

    // Redis bağlantı hatalarını dinle (rate limited)
    this.on('error', (error) => {
      const now = Date.now();
      // Sadece belirli aralıklarla hata logla (spam önleme)
      if (now - this.lastErrorLogTime > this.ERROR_LOG_INTERVAL) {
        this.logger.warn(
          `Redis connection error: ${error.message}. Queue operations may be unavailable. Ensure Redis is running on ${configService.redisHost}:${configService.redisPort}`,
        );
        this.lastErrorLogTime = now;
      }
      this.isRedisAvailable = false;
    });

    // Başarılı işlemlerde Redis'in kullanılabilir olduğunu işaretle
    this.on('waiting', (jobId) => {
      this.logger.debug(`Job ${jobId} is waiting`);
      // Job waiting durumuna geçtiyse Redis bağlantısı çalışıyor demektir
      if (!this.isRedisAvailable) {
        this.isRedisAvailable = true;
        this.logger.log(`Redis connection verified through job queue`);
      }
    });
  }

  async onModuleInit() {
    const connection = this.opts.connection as { host?: string; port?: number };
    this.logger.log(
      `Notification queue initialized for Redis at ${connection.host || 'localhost'}:${connection.port || 6379}`,
    );

    // Redis bağlantısını kontrol et
    await this.checkRedisConnection();
  }

  private async checkRedisConnection() {
    // Redis bağlantısını test etmek için basit bir işlem yapalım
    // BullMQ Queue'unun client'ına erişerek bağlantıyı test edebiliriz
    try {
      // Queue'un internal client'ına erişim
      const client = (this as any).client;
      if (client && typeof client.ping === 'function') {
        try {
          await client.ping();
          this.isRedisAvailable = true;
          this.logger.log(`Redis connection verified successfully at ${(this.opts.connection as any)?.host || 'localhost'}:${(this.opts.connection as any)?.port || 6379}`);
          return;
        } catch (pingError) {
          // Ping başarısız, bağlantı yok
          this.logger.debug('Redis ping failed, connection may not be ready yet');
        }
      }
    } catch (error) {
      // Client erişimi başarısız, normal olabilir (henüz bağlantı kurulmamış olabilir)
      this.logger.debug('Redis client access pending, waiting for connection...');
    }

    // Eğer hemen bağlantı kurulamadıysa, biraz bekleyip tekrar kontrol et
    // Ayrıca ilk job eklendiğinde bağlantı doğrulanacak
    setTimeout(async () => {
      if (!this.isRedisAvailable) {
        // Tekrar dene
        try {
          const client = (this as any).client;
          if (client && typeof client.ping === 'function') {
            await client.ping();
            this.isRedisAvailable = true;
            this.logger.log('Redis connection verified on retry');
            return;
          }
        } catch (error) {
          // Hala bağlantı yok
        }
        
        // Hala bağlantı kurulamadıysa uyarı ver
        if (!this.isRedisAvailable) {
          this.logger.warn(
            `Redis connection check: Redis may not be available. Queue operations may fail. Please ensure Redis is running.`,
          );
        }
      }
    }, 3000); // 3 saniye sonra durumu kontrol et
  }

  /**
   * Redis'in kullanılabilir olup olmadığını kontrol et
   */
  get redisAvailable(): boolean {
    return this.isRedisAvailable;
  }

  /**
   * Job ekleme işlemini Redis durumuna göre yap
   */
  async addSafe(jobName: string, data: any, options?: any) {
    try {
      const job = await this.add(jobName, data, options);
      // Başarılı olduysa Redis çalışıyor demektir
      if (!this.isRedisAvailable) {
        this.isRedisAvailable = true;
        this.logger.log(`Redis connection verified through successful job addition`);
      }
      return job;
    } catch (error) {
      this.isRedisAvailable = false;
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        this.logger.warn(
          `Cannot add job '${jobName}': Redis is not available. Job data: ${JSON.stringify(data)}`,
        );
        throw new Error('Redis is not available. Cannot add job to queue.');
      }
      throw error;
    }
  }

  /**
   * Override add method to track Redis availability
   */
  override async add(name: string, data: any, opts?: any) {
    try {
      const job = await super.add(name, data, opts);
      // Başarılı olduysa Redis çalışıyor demektir
      if (!this.isRedisAvailable) {
        this.isRedisAvailable = true;
        this.logger.log(`Redis connection verified through successful job addition`);
      }
      return job;
    } catch (error) {
      this.isRedisAvailable = false;
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    await this.close();
  }
}

