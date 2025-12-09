// src/api/regionsApi.ts
import httpClient from './httpClient';
import type {
  Province,
  District,
  Workplace,
  Dealer,
  UserScope,
} from '../types/region';

// 🔹 İller
export const getProvinces = async (): Promise<Province[]> => {
  const res = await httpClient.get<Province[]>('/regions/provinces');
  return Array.isArray(res.data) ? res.data : [];
};

export const createProvince = async (payload: {
  name: string;
  code?: string;
}): Promise<Province> => {
  const res = await httpClient.post<Province>('/regions/provinces', payload);
  return res.data;
};

export const updateProvince = async (
  id: string,
  payload: {
    name: string;
    code?: string;
  },
): Promise<Province> => {
  const res = await httpClient.put<Province>(`/regions/provinces/${id}`, payload);
  return res.data;
};

// 🔹 İlçeler
export const getDistricts = async (
  provinceId?: string,
): Promise<District[]> => {
  const res = await httpClient.get<District[]>('/regions/districts', {
    params: provinceId ? { provinceId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
};

export const createDistrict = async (payload: {
  name: string;
  provinceId: string;
}): Promise<District> => {
  const res = await httpClient.post<District>('/regions/districts', payload);
  return res.data;
};

export const updateDistrict = async (
  id: string,
  payload: {
    name: string;
    provinceId: string;
  },
): Promise<District> => {
  const res = await httpClient.put<District>(`/regions/districts/${id}`, payload);
  return res.data;
};

// 🔹 İşyeri
export const getWorkplaces = async (filters?: {
  provinceId?: string;
  districtId?: string;
}): Promise<Workplace[]> => {
  const res = await httpClient.get<Workplace[]>('/regions/workplaces', {
    params: filters,
  });
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Bayi
export const getDealers = async (filters?: {
  provinceId?: string;
  districtId?: string;
}): Promise<Dealer[]> => {
  const res = await httpClient.get<Dealer[]>('/regions/dealers', {
    params: filters,
  });
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Kullanıcı scope
export const getUserScopes = async (userId: string): Promise<UserScope[]> => {
  const res = await httpClient.get<UserScope[]>(`/regions/user-scope/${userId}`);
  return Array.isArray(res.data) ? res.data : [];
};

export const createUserScope = async (payload: {
  userId: string;
  provinceId?: string;
  districtId?: string;
  workplaceId?: string;
  dealerId?: string;
}): Promise<UserScope> => {
  const res = await httpClient.post<UserScope>('/regions/user-scope', payload);
  return res.data;
};

export const deleteUserScope = async (scopeId: string): Promise<void> => {
  await httpClient.delete(`/regions/user-scope/${scopeId}`);
};


// 🔹 İşyeri oluştur
export const createWorkplace = async (payload: {
  name: string;
  address?: string;
  provinceId?: string;
  districtId?: string;
}): Promise<Workplace> => {
  const res = await httpClient.post<Workplace>('/regions/workplaces', payload);
  return res.data;
};

// 🔹 İşyeri güncelle
export const updateWorkplace = async (
  id: string,
  payload: {
    name: string;
    address?: string;
    provinceId?: string;
    districtId?: string;
  },
): Promise<Workplace> => {
  const res = await httpClient.put<Workplace>(`/regions/workplaces/${id}`, payload);
  return res.data;
};


// 🔹 Bayi oluştur
export const createDealer = async (payload: {
  name: string;
  code?: string;
  address?: string;
  provinceId?: string;
  districtId?: string;
}): Promise<Dealer> => {
  const res = await httpClient.post<Dealer>('/regions/dealers', payload);
  return res.data;
};

// 🔹 Bayi güncelle
export const updateDealer = async (
  id: string,
  payload: {
    name: string;
    code?: string;
    address?: string;
    provinceId?: string;
    districtId?: string;
  },
): Promise<Dealer> => {
  const res = await httpClient.put<Dealer>(`/regions/dealers/${id}`, payload);
  return res.data;
};
