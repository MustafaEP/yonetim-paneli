import { api } from './client';
import { LoggedInUser } from './auth';

export const getCurrentUser = async (): Promise<LoggedInUser> => {
  const res = await api.get<LoggedInUser>('/users/me');
  return res.data;
};
