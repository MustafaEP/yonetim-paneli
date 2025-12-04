import { api } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoggedInUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: LoggedInUser;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', data);
  return res.data;
};
