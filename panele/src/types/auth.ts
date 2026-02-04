// src/types/auth.ts
import type { Role } from './user';

export interface BackendUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  permissions: string[];
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: BackendUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  user: BackendUser;
}
