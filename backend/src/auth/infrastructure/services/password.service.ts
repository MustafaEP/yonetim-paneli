/**
 * PasswordService – Şifre hash ve doğrulama.
 * Auth (compare) ve ileride user oluşturma/güncelleme (hash) tek yerden yönetilir.
 */
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  /**
   * Düz metin şifreyi hash'ler (user oluşturma/güncellemede kullanılır).
   */
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  /**
   * Düz metin şifre ile hash'i karşılaştırır (login'de kullanılır).
   */
  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
