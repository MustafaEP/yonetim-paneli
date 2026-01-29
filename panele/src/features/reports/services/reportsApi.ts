// src/features/reports/services/reportsApi.ts
import httpClient from '../../../shared/services/httpClient';

export interface GlobalReport {
  totalMembers: number;
  activeMembers: number;
  cancelledMembers: number;
  totalUsers: number;
  totalRoles: number;
  totalDuesPlans: number;
  totalPayments: number;
  totalDebt: number;
  byProvince: Array<{
    provinceId: string;
    provinceName: string;
    memberCount: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface RegionReport {
  regionId: string;
  regionName: string;
  memberCount: number;
  activeMembers: number;
  cancelledMembers: number;
  totalPayments: number;
  totalDebt: number;
}

export interface MemberStatusReport {
  status: string;
  count: number;
  percentage: number;
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    memberNumber?: string;
    status: string;
  }>;
}

export interface DuesReport {
  totalPayments: number;
  totalDebt: number;
  paidMembers: number;
  unpaidMembers: number;
  byMonth: Array<{
    month: number;
    year: number;
    total: number;
    count: number;
  }>;
  byPlan: Array<{
    planId: string;
    planName: string;
    totalPayments: number;
    memberCount: number;
  }>;
}

// Genel rapor
export const getGlobalReport = async (): Promise<GlobalReport> => {
  const res = await httpClient.get<GlobalReport>('/reports/global');
  return res.data;
};

// Bölge raporu
export const getRegionReport = async (
  regionId?: string,
): Promise<RegionReport | RegionReport[]> => {
  const res = await httpClient.get<RegionReport | RegionReport[]>('/reports/region', {
    params: regionId ? { regionId } : undefined,
  });
  return res.data;
};

// Üye durum raporu
export const getMemberStatusReport = async (): Promise<MemberStatusReport[]> => {
  const res = await httpClient.get<MemberStatusReport[]>('/reports/member-status');
  return Array.isArray(res.data) ? res.data : [];
};

// Aidat raporu
export const getDuesReport = async (params?: {
  year?: number;
  month?: number;
}): Promise<DuesReport> => {
  const res = await httpClient.get<DuesReport>('/reports/dues', { params });
  return res.data;
};

// Export fonksiyonları
export const exportGlobalReportToExcel = async (): Promise<void> => {
  const res = await httpClient.get('/reports/global/export/excel', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Genel_Rapor_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportGlobalReportToPdf = async (): Promise<void> => {
  const res = await httpClient.get('/reports/global/export/pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Genel_Rapor_${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportRegionReportToExcel = async (regionId?: string): Promise<void> => {
  const res = await httpClient.get('/reports/region/export/excel', {
    params: regionId ? { regionId } : undefined,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bolge_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportRegionReportToPdf = async (regionId?: string): Promise<void> => {
  const res = await httpClient.get('/reports/region/export/pdf', {
    params: regionId ? { regionId } : undefined,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bolge_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportDuesReportToExcel = async (params?: {
  year?: number;
  month?: number;
}): Promise<void> => {
  const res = await httpClient.get('/reports/dues/export/excel', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Aidat_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportDuesReportToPdf = async (params?: {
  year?: number;
  month?: number;
}): Promise<void> => {
  const res = await httpClient.get('/reports/dues/export/pdf', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Aidat_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportMemberStatusReportToExcel = async (): Promise<void> => {
  const res = await httpClient.get('/reports/member-status/export/excel', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Uye_Durum_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportMemberStatusReportToPdf = async (): Promise<void> => {
  const res = await httpClient.get('/reports/member-status/export/pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Uye_Durum_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

