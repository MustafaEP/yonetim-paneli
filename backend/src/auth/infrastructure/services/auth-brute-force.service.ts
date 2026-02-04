/**
 * Brute force koruması – IP bazlı başarısız giriş sayacı ve geçici kilitleme.
 * In-memory; restart sonrası sıfırlanır. İleride Redis/DB ile değiştirilebilir.
 */
import { Injectable } from '@nestjs/common';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 dakika

interface Slot {
  count: number;
  lockedUntil: number;
}

@Injectable()
export class AuthBruteForceService {
  private readonly store = new Map<string, Slot>();

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
    if (slot.count >= MAX_FAILED_ATTEMPTS) {
      slot.lockedUntil = now + LOCKOUT_MS;
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
