// src/api/institutionsApi.ts
import httpClient from './httpClient';

export interface Institution {
  id: string;
  name: string;
  provinceId: string;
  province?: { id: string; name: string };
  districtId?: string | null;
  district?: { id: string; name: string } | null;
  branchId: string;
  branch?: { id: string; name: string; code?: string | null };
  isActive: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstitutionDto {
  name: string;
  provinceId: string;
  districtId?: string;
  branchId: string;
}

export interface UpdateInstitutionDto {
  name?: string;
  provinceId?: string;
  districtId?: string;
  branchId?: string;
}

export const getInstitutions = async (): Promise<Institution[]> => {
  const res = await httpClient.get<Institution[]>('/institutions');
  return Array.isArray(res.data) ? res.data : [];
};

export const getInstitutionById = async (id: string): Promise<Institution> => {
  const res = await httpClient.get<Institution>(`/institutions/${id}`);
  return res.data;
};

export const createInstitution = async (data: CreateInstitutionDto): Promise<Institution> => {
  const res = await httpClient.post<Institution>('/institutions', data);
  return res.data;
};

export const updateInstitution = async (
  id: string,
  data: UpdateInstitutionDto,
): Promise<Institution> => {
  const res = await httpClient.patch<Institution>(`/institutions/${id}`, data);
  return res.data;
};

export const approveInstitution = async (id: string): Promise<Institution> => {
  const res = await httpClient.post<Institution>(`/institutions/${id}/approve`, {});
  return res.data;
};

export const rejectInstitution = async (id: string): Promise<Institution> => {
  const res = await httpClient.post<Institution>(`/institutions/${id}/reject`, {});
  return res.data;
};

export const deleteInstitution = async (id: string): Promise<void> => {
  await httpClient.delete(`/institutions/${id}`);
};
