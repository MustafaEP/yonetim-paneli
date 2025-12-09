// src/api/authApi.ts
import httpClient from './httpClient';
import type { LoginRequest, LoginResponse } from '../types/auth';

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

