/**
 * API / axios tarzı hatalardan kullanıcıya gösterilecek mesajı çıkarır.
 * Catch bloklarında tekrarlayan cast ve fallback mantığını merkezileştirir.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error == null) return fallback;
  const err = error as { response?: { data?: { message?: string } } };
  const message = err?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
}
