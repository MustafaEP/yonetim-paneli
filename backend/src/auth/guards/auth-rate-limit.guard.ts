/**
 * Auth rate limit guard – login ve refresh endpoint'lerini IP bazlı sınırlar.
 * Brute force ve aşırı istek riskini azaltır; ek paket gerektirmez.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

const TTL_MS = 60 * 1000; // 1 dakika
const MAX_REQUESTS_PER_TTL = 10; // dakikada en fazla 10 istek (login + refresh toplam)

interface Slot {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Slot>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const now = Date.now();

    let slot = this.store.get(ip);
    if (!slot) {
      this.store.set(ip, { count: 1, resetAt: now + TTL_MS });
      return true;
    }
    if (now >= slot.resetAt) {
      slot = { count: 1, resetAt: now + TTL_MS };
      this.store.set(ip, slot);
      return true;
    }
    slot.count += 1;
    if (slot.count > MAX_REQUESTS_PER_TTL) {
      throw new HttpException(
        { message: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private getClientIp(request: Request): string {
    return (
      request.ip ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
