/**
 * API / axios tarzı hatalardan kullanıcıya gösterilecek mesajı çıkarır.
 * Catch bloklarında tekrarlayan cast ve fallback mantığını merkezileştirir.
 * NestJS bazen message'ı string[] döndürür; birleştirilir.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error == null) return fallback;
  const err = error as { response?: { data?: { message?: string | string[]; error?: string } } };
  const raw = err?.response?.data?.message ?? err?.response?.data?.error;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length > 0) {
    const joined = raw.map((m) => (typeof m === 'string' ? m : '')).filter(Boolean).join('; ');
    if (joined) return joined;
  }
  return fallback;
}
