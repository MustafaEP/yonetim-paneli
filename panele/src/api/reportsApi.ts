// src/api/reportsApi.ts
import httpClient from './httpClient';

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
  workplaces: Array<{
    workplaceId: string;
    workplaceName: string;
    memberCount: number;
  }>;
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

