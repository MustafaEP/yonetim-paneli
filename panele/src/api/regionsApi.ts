// src/api/regionsApi.ts
import httpClient from './httpClient';
import type {
  Province,
  District,
  Workplace,
  Dealer,
  UserScope,
} from '../types/region';

// 🔹 Provinces
export const getProvinces = async (): Promise<Province[]> => {
  const res = await httpClient.get<Province[]>('/regions/provinces');
  return res.data;
};

export const createProvince = async (data: {
  name: string;
  code?: string;
}): Promise<Province> => {
  const res = await httpClient.post<Province>('/regions/provinces', data);
  return res.data;
};

export const updateProvince = async (
  id: string,
  data: { name: string; code?: string },
): Promise<Province> => {
  const res = await httpClient.put<Province>(`/regions/provinces/${id}`, data);
  return res.data;
};

// 🔹 Districts
export const getDistricts = async (provinceId?: string): Promise<District[]> => {
  const res = await httpClient.get<District[]>('/regions/districts', {
    params: provinceId ? { provinceId } : undefined,
  });
  return res.data;
};

// 🔹 Workplaces
export const getWorkplaces = async (params?: {
  provinceId?: string;
  districtId?: string;
}): Promise<Workplace[]> => {
  const res = await httpClient.get<Workplace[]>('/regions/workplaces', {
    params,
  });
  return res.data;
};

// 🔹 Dealers
export const getDealers = async (params?: {
  provinceId?: string;
  districtId?: string;
}): Promise<Dealer[]> => {
  const res = await httpClient.get<Dealer[]>('/regions/dealers', {
    params,
  });
  return res.data;
};

// 🔹 Kullanıcı scope'larını getir: GET /regions/user-scope/:userId
export const getUserScopes = async (userId: string): Promise<UserScope[]> => {
  const res = await httpClient.get<UserScope[]>(`/regions/user-scope/${userId}`);
  return res.data;
};

// 🔹 Kullanıcıya scope ata: POST /regions/user-scope
// Body: { userId, provinceId?, districtId?, workplaceId?, dealerId? } (en az bir tanesi dolu olmalı)
export const createUserScope = async (data: {
  userId: string;
  provinceId?: string;
  districtId?: string;
  workplaceId?: string;
  dealerId?: string;
}): Promise<UserScope> => {
  const res = await httpClient.post<UserScope>('/regions/user-scope', data);
  return res.data;
};
