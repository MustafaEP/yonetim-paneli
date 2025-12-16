// src/api/branchesApi.ts
import httpClient from './httpClient';

export interface Branch {
  id: string;
  name: string;
  code?: string;
  provinceId: string;
  province?: {
    id: string;
    name: string;
    code?: string;
  };
  districtId?: string;
  district?: {
    id: string;
    name: string;
  };
  presidentId?: string;
  president?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  branchSharePercent?: number | string;
  memberCount?: number;
  institutionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchDetail extends Branch {
  activeMemberCount: number;
  totalRevenue: number | string;
  branchShareAmount: number | string;
  institutions: Array<{
    id: string;
    name: string;
    province?: {
      id: string;
      name: string;
    };
    district?: {
      id: string;
      name: string;
    };
    isActive: boolean;
    approvedAt: string | null;
  }>;
}

export interface CreateBranchDto {
  name: string;
  code?: string;
  provinceId: string;
  districtId?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateBranchDto {
  name?: string;
  code?: string;
  provinceId?: string;
  districtId?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface AssignPresidentDto {
  presidentId: string;
}

// Şube listesi
export const getBranches = async (params?: {
  provinceId?: string;
  districtId?: string;
  isActive?: boolean;
}): Promise<Branch[]> => {
  const res = await httpClient.get<Branch[]>('/regions/branches', { params });
  return Array.isArray(res.data) ? res.data : [];
};

// Şube detayı
export const getBranchById = async (id: string): Promise<BranchDetail> => {
  const res = await httpClient.get<BranchDetail>(`/regions/branches/${id}`);
  return res.data;
};

// Şube oluştur
export const createBranch = async (payload: CreateBranchDto): Promise<Branch> => {
  const res = await httpClient.post<Branch>('/regions/branches', payload);
  return res.data;
};

// Şube güncelle
export const updateBranch = async (
  id: string,
  payload: UpdateBranchDto,
): Promise<Branch> => {
  const res = await httpClient.put<Branch>(`/regions/branches/${id}`, payload);
  return res.data;
};

// Şube sil
export const deleteBranch = async (id: string): Promise<void> => {
  await httpClient.delete(`/regions/branches/${id}`);
};

// Şube başkanı ata
export const assignBranchPresident = async (
  id: string,
  payload: AssignPresidentDto,
): Promise<Branch> => {
  const res = await httpClient.post<Branch>(`/regions/branches/${id}/assign-president`, payload);
  return res.data;
};

