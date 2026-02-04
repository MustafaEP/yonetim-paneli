// src/features/accounting/services/accountingApi.ts
import httpClient from '../../../shared/services/httpClient';

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
  tevkifatTitleId?: string | null;
  tevkifatTitle?: { id: string; name: string } | null;
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
  provinceId?: string;
  districtId?: string;
}

export interface UpdateTevkifatCenterDto {
  name?: string;
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

export interface DeleteTevkifatCenterDto {
  memberActionType: 'REMOVE_TEVKIFAT_CENTER' | 'TRANSFER_TO_TEVKIFAT_CENTER' | 'REMOVE_AND_DEACTIVATE' | 'TRANSFER_AND_DEACTIVATE' | 'TRANSFER_AND_CANCEL';
  targetTevkifatCenterId?: string;
}

export const deleteTevkifatCenter = async (id: string, dto: DeleteTevkifatCenterDto): Promise<TevkifatCenter> => {
  const res = await httpClient.delete<TevkifatCenter>(`/accounting/tevkifat-centers/${id}`, { data: dto });
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

// Tevkifat Merkezi Dosya Yükleme
export const uploadTevkifatCenterDocument = async (
  tevkifatCenterId: string,
  file: File,
  fileName?: string,
  description?: string,
  tevkifatTitleId?: string,
  month?: number,
  year?: number,
): Promise<TevkifatFile> => {
  const formData = new FormData();
  formData.append('file', file);
  if (fileName) {
    formData.append('fileName', fileName);
  }
  if (description) {
    formData.append('description', description);
  }
  if (tevkifatTitleId) {
    formData.append('tevkifatTitleId', tevkifatTitleId);
  }
  if (month) {
    formData.append('month', month.toString());
  }
  if (year) {
    formData.append('year', year.toString());
  }

  const res = await httpClient.post<TevkifatFile>(
    `/accounting/tevkifat-centers/${tevkifatCenterId}/upload-document`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
};

/** Tevkifat dosyası/evrakı indir */
export const downloadTevkifatFile = async (
  fileId: string,
  fileName?: string,
): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  const baseURL = httpClient.defaults.baseURL || '';
  const url = `${baseURL}/accounting/tevkifat-files/${fileId}/download`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Dosya indirilemedi');
  }

  const blob = await response.blob();
  const finalFileName =
    fileName ||
    response.headers
      .get('Content-Disposition')
      ?.match(/filename="?([^";]+)"?/)?.[1] ||
    'tevkifat-evrak.pdf';
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};
