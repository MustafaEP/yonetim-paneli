/**
 * TokenService – JWT access ve refresh token üretimi / doğrulama.
 * Access doğrulama (verify) şu an Passport JWT strategy tarafından yapılıyor.
 */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../../config/config.service';
import type {
  AccessPayload,
  RefreshPayload,
} from '../../domain/types/token-payload.types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Access token üretir. Süre JwtModule config'ten (access) gelir.
   */
  signAccess(payload: AccessPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  /**
   * Refresh token üretir (sadece sub; süre env'den refresh süresi).
   */
  signRefresh(userId: string): Promise<string> {
    const payload: RefreshPayload = { sub: userId };
    // JwtSignOptions.expiresIn tipi string kabul etmeyebilir; runtime'da "7d" geçerli
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.jwtRefreshExpiresIn,
    } as any);
  }

  /**
   * Refresh token'ı doğrular; geçerliyse payload döner.
   */
  async verifyRefresh(token: string): Promise<RefreshPayload> {
    return this.jwtService.verifyAsync<RefreshPayload>(token);
  }

  /**
   * Refresh token'ı doğrulamadan decode eder (expiresAt almak için).
   */
  decodeRefresh(token: string): { sub: string; exp?: number } | null {
    const payload = this.jwtService.decode(token);
    if (!payload || typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, exp: payload.exp };
  }
}
