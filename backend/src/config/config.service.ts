import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || 'http://localhost:5173';
  }

  get corsCredentials(): boolean {
    return process.env.CORS_CREDENTIALS === 'true';
  }
}

