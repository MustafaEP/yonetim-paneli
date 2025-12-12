import { Injectable } from '@nestjs/common';
import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from './config.service';

@Injectable()
export class JwtConfigService {
  constructor(private configService: ConfigService) {}

  createJwtOptions(): JwtModuleOptions {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

    return {
      secret,
      signOptions: {
        expiresIn: expiresIn as any,
      },
    };
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'dev-secret';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '15m';
  }
}

