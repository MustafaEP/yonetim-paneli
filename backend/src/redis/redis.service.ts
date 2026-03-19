import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private _connected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      password: this.configService.redisPassword || undefined,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 500, 5000),
      enableOfflineQueue: false,
    });

    this.client.on('connect', () => {
      this._connected = true;
      this.logger.log('Redis bağlantısı kuruldu.');
    });

    this.client.on('error', (err) => {
      this._connected = false;
      this.logger.warn(`Redis bağlantı hatası: ${err.message}`);
    });

    this.client.connect().catch(() => {
      this.logger.warn(
        'Redis başlangıçta bağlanamadı. In-memory fallback aktif olacak.',
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => null);
  }

  get isConnected(): boolean {
    return this._connected;
  }

  getClient(): Redis {
    return this.client;
  }

  /** key'in değerini artırır; ilk artırımda TTL (saniye) ayarlar. */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
