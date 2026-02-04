/**
 * JWT Access Token payload tipi.
 * Strategy ve Guard'lar bu yapıyı kullanır.
 */
export interface AccessPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/**
 * JWT Refresh Token payload tipi (sadece sub).
 */
export interface RefreshPayload {
  sub: string;
}
