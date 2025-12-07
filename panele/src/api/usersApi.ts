// src/api/usersApi.ts
import httpClient from './httpClient';
import type { UserListItem, UserDetail } from '../types/user';

export const getUsers = async (): Promise<UserListItem[]> => {
  const res = await httpClient.get<UserListItem[]>('/users');
  return res.data;
};

export const getUserById = async (id: string): Promise<UserDetail> => {
  const res = await httpClient.get<UserDetail>(`/users/${id}`);
  return res.data;
};
