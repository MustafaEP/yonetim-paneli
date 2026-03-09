/**
 * Brute force koruması – IP bazlı başarısız giriş sayacı ve geçici kilitleme.
 * In-memory; restart sonrası sıfırlanır. İleride Redis/DB ile değiştirilebilir.
 * Limitler SECURITY_MAX_LOGIN_ATTEMPTS ve SECURITY_LOCKOUT_DURATION sistem ayarlarından okunur.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';

interface Slot {
  count: number;
  lockedUntil: number;
}

@Injectable()
export class AuthBruteForceService {
  private readonly store = new Map<string, Slot>();

  constructor(private readonly configService: ConfigService) {}

  private get maxAttempts(): number {
    return this.configService.getSystemSettingNumber(
      'SECURITY_MAX_LOGIN_ATTEMPTS',
      5,
    );
  }

  private get lockoutMs(): number {
    const minutes = this.configService.getSystemSettingNumber(
      'SECURITY_LOCKOUT_DURATION',
      15,
    );
    return minutes * 60 * 1000;
  }

  /** Kalan kilitlenme süresini dakika olarak döner (kilitli değilse 0). */
  getLockoutRemainingMinutes(ip: string): number {
    if (!ip || ip === 'unknown') return 0;
    const slot = this.store.get(ip);
    if (!slot) return 0;
    const remaining = slot.lockedUntil - Date.now();
    if (remaining <= 0) {
      this.store.delete(ip);
      return 0;
    }
    return Math.ceil(remaining / 60000);
  }

  /**
   * Bu IP şu an kilitli mi?
   */
  isLocked(ip: string): boolean {
    if (!ip || ip === 'unknown') return false;
    const slot = this.store.get(ip);
    if (!slot) return false;
    if (Date.now() < slot.lockedUntil) return true;
    this.store.delete(ip);
    return false;
  }

  /**
   * Başarısız giriş kaydı; limit aşılırsa kilitleme süresi set edilir.
   */
  recordFailure(ip: string): void {
    if (!ip || ip === 'unknown') return;
    const now = Date.now();
    let slot = this.store.get(ip);
    if (!slot || now >= slot.lockedUntil) {
      slot = { count: 0, lockedUntil: 0 };
    }
    slot.count += 1;
    if (slot.count >= this.maxAttempts) {
      slot.lockedUntil = now + this.lockoutMs;
    }
    this.store.set(ip, slot);
  }

  /**
   * Başarılı girişte sayacı sıfırla.
   */
  recordSuccess(ip: string): void {
    if (!ip || ip === 'unknown') return;
    this.store.delete(ip);
  }
}
