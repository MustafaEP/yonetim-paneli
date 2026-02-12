const NETWORK_SERVER_FALLBACK =
  'Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';

/**
 * Returns true if the error is a network failure (no response, timeout) or server error (5xx).
 */
export function isNetworkOrServerError(error: unknown): boolean {
  if (error == null) return false;
  const err = error as { code?: string; response?: { status?: number } };
  if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') return true;
  const status = err?.response?.status;
  return typeof status === 'number' && status >= 500;
}

/**
 * API / axios tarzı hatalardan kullanıcıya gösterilecek mesajı çıkarır.
 * Catch bloklarında tekrarlayan cast ve fallback mantığını merkezileştirir.
 * NestJS bazen message'ı string[] döndürür; birleştirilir.
 * Network/server hatalarında kullanıcı dostu bir mesaj döner.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;
  if (isNetworkOrServerError(error)) return NETWORK_SERVER_FALLBACK;
  const err = error as { response?: { data?: { message?: string | string[]; error?: string } } };
  const raw = err?.response?.data?.message ?? err?.response?.data?.error;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length > 0) {
    const joined = raw.map((m) => (typeof m === 'string' ? m : '')).filter(Boolean).join('; ');
    if (joined) return joined;
  }
  return fallback;
}
