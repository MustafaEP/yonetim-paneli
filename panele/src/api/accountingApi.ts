// src/api/accountingApi.ts
import httpClient from './httpClient';

export interface AccountingMember {
  id: string;
  registrationNumber?: string | null;
  firstName: string;
  lastName: string;
  institution?: { id: string; name: string } | null;
  tevkifatCenter?: { id: string; name: string; title: string | null } | null;
  branch?: { id: string; name: string } | null;
  duesPayments: Array<{
    id: string;
    amount: number | string;
    periodYear?: number | null;
    periodMonth?: number | null;
    paidAt: string;
  }>;
}

export interface TevkifatFile {
  id: string;
  tevkifatCenterId: string;
  tevkifatCenter?: { id: string; name: string; title: string | null };
  totalAmount: number | string;
  memberCount: number;
  month: number;
  year: number;
  positionTitle?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedBy: string;
  uploadedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: string | null;
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadTevkifatFileDto {
  tevkifatCenterId: string;
  totalAmount: number;
  memberCount: number;
  month: number;
  year: number;
  positionTitle?: 'KADRO_657' | 'SOZLESMELI_4B' | 'KADRO_663' | 'AILE_HEKIMLIGI' | 'UNVAN_4924' | 'DIGER_SAGLIK_PERSONELI';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
}

export const getAccountingMembers = async (filters?: {
  branchId?: string;
  tevkifatCenterId?: string;
  year?: number;
  month?: number;
}): Promise<AccountingMember[]> => {
  const res = await httpClient.get<AccountingMember[]>('/accounting/members', { params: filters });
  return Array.isArray(res.data) ? res.data : [];
};

export const getTevkifatFiles = async (filters?: {
  year?: number;
  month?: number;
  tevkifatCenterId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}): Promise<TevkifatFile[]> => {
  const res = await httpClient.get<TevkifatFile[]>('/accounting/tevkifat-files', { params: filters });
  return Array.isArray(res.data) ? res.data : [];
};

export const uploadTevkifatFile = async (data: UploadTevkifatFileDto): Promise<TevkifatFile> => {
  const res = await httpClient.post<TevkifatFile>('/accounting/tevkifat-files', data);
  return res.data;
};

export const approveTevkifatFile = async (id: string): Promise<TevkifatFile> => {
  const res = await httpClient.post<TevkifatFile>(`/accounting/tevkifat-files/${id}/approve`, {});
  return res.data;
};

export const rejectTevkifatFile = async (id: string): Promise<TevkifatFile> => {
  const res = await httpClient.post<TevkifatFile>(`/accounting/tevkifat-files/${id}/reject`, {});
  return res.data;
};

// Tevkifat Merkezleri
export interface TevkifatCenter {
  id: string;
  name: string;
  title: string | null;
  code: string | null;
  description: string | null;
  address: string | null;
  isActive: boolean;
  provinceId?: string | null;
  districtId?: string | null;
  province?: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  district?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  lastTevkifatMonth?: string | null;
}

export interface TevkifatCenterDetail extends TevkifatCenter {
  _count: {
    members: number;
    files: number;
    payments: number;
  };
  yearlySummary: Array<{
    year: number;
    totalAmount: number;
    averageMonthlyAmount: number;
    memberCount: number;
  }>;
  monthlySummary: Array<{
    year: number;
    month: number;
    totalAmount: number;
    memberCount: number;
  }>;
}

export interface CreateTevkifatCenterDto {
  name: string;
  title?: string;
  code?: string;
  description?: string;
  address?: string;
  provinceId?: string;
  districtId?: string;
}

export interface UpdateTevkifatCenterDto {
  name?: string;
  title?: string;
  code?: string;
  description?: string;
  address?: string;
  isActive?: boolean;
  provinceId?: string | null;
  districtId?: string | null;
}

export const getTevkifatCenters = async (filters?: {
  provinceId?: string;
  districtId?: string;
}): Promise<TevkifatCenter[]> => {
  const res = await httpClient.get<TevkifatCenter[]>('/accounting/tevkifat-centers', {
    params: filters,
  });
  return Array.isArray(res.data) ? res.data : [];
};

export const getTevkifatCenterById = async (id: string): Promise<TevkifatCenterDetail> => {
  const res = await httpClient.get<TevkifatCenterDetail>(`/accounting/tevkifat-centers/${id}`);
  return res.data;
};

export const createTevkifatCenter = async (data: CreateTevkifatCenterDto): Promise<TevkifatCenter> => {
  const res = await httpClient.post<TevkifatCenter>('/accounting/tevkifat-centers', data);
  return res.data;
};

export const updateTevkifatCenter = async (
  id: string,
  data: UpdateTevkifatCenterDto,
): Promise<TevkifatCenter> => {
  const res = await httpClient.patch<TevkifatCenter>(`/accounting/tevkifat-centers/${id}`, data);
  return res.data;
};

export const deleteTevkifatCenter = async (id: string): Promise<TevkifatCenter> => {
  const res = await httpClient.delete<TevkifatCenter>(`/accounting/tevkifat-centers/${id}`);
  return res.data;
};

// Tevkifat Unvanları
export interface TevkifatTitle {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTevkifatTitleDto {
  name: string;
}

export interface UpdateTevkifatTitleDto {
  name?: string;
  isActive?: boolean;
}

export const getTevkifatTitles = async (): Promise<TevkifatTitle[]> => {
  const res = await httpClient.get<TevkifatTitle[]>('/accounting/tevkifat-titles');
  return Array.isArray(res.data) ? res.data : [];
};

export const getTevkifatTitleById = async (id: string): Promise<TevkifatTitle> => {
  const res = await httpClient.get<TevkifatTitle>(`/accounting/tevkifat-titles/${id}`);
  return res.data;
};

export const createTevkifatTitle = async (dto: CreateTevkifatTitleDto): Promise<TevkifatTitle> => {
  const res = await httpClient.post<TevkifatTitle>('/accounting/tevkifat-titles', dto);
  return res.data;
};

export const updateTevkifatTitle = async (
  id: string,
  dto: UpdateTevkifatTitleDto,
): Promise<TevkifatTitle> => {
  const res = await httpClient.patch<TevkifatTitle>(`/accounting/tevkifat-titles/${id}`, dto);
  return res.data;
};

export const deleteTevkifatTitle = async (id: string): Promise<void> => {
  await httpClient.delete(`/accounting/tevkifat-titles/${id}`);
};
