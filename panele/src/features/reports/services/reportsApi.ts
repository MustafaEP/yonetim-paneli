// src/features/reports/services/reportsApi.ts

/**
 * Raporlar sayfası backend API'sini kullanır.
 *
 * Backend endpoint'leri:
 * - GET  /reports/kpis              -> Özet metrikler (KPI'lar)
 * - GET  /reports/members           -> Üye raporu
 * - GET  /reports/regions           -> Bölge raporu
 * - GET  /reports/applications      -> Başvuru raporu
 * - POST /reports/generate           -> Tüm rapor verileri (filtrelenmiş, tercih edilen)
 *
 * POST body / Query parametreleri:
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - branchId: string
 * - provinceIds: string[] (POST'ta dizi, GET'te virgülle ayrılmış)
 * - districtIds: string[] (POST'ta dizi, GET'te virgülle ayrılmış)
 * - status: MemberStatus
 */

import httpClient from '../../../shared/services/httpClient';
import type {
  ReportFilters,
  ReportKPIs,
  MemberReportRow,
  RegionReportRow,
  ApplicationReportRow,
  ReportData,
} from './reportsMock';

/** Backend'den gelen rapor tipleri (reportsMock ile uyumlu) */
export type {
  ReportFilters,
  ReportKPIs,
  MemberReportRow,
  RegionReportRow,
  ApplicationReportRow,
  ReportData,
} from './reportsMock';

// KPI'ları getir
export const fetchKPIs = async (filters: ReportFilters): Promise<ReportKPIs> => {
  const params = prepareQueryParams(filters);
  const response = await httpClient.get<ReportKPIs>('/reports/kpis', { params });
  return response.data;
};

// Üye raporu getir
export const fetchMemberReport = async (filters: ReportFilters): Promise<MemberReportRow[]> => {
  const params = prepareQueryParams(filters);
  const response = await httpClient.get<MemberReportRow[]>('/reports/members', { params });
  return response.data;
};

// Bölge raporu getir
export const fetchRegionReport = async (filters: ReportFilters): Promise<RegionReportRow[]> => {
  const params = prepareQueryParams(filters);
  const response = await httpClient.get<RegionReportRow[]>('/reports/regions', { params });
  return response.data;
};

// Başvuru raporu getir
export const fetchApplicationReport = async (filters: ReportFilters): Promise<ApplicationReportRow[]> => {
  const params = prepareQueryParams(filters);
  const response = await httpClient.get<ApplicationReportRow[]>('/reports/applications', { params });
  return response.data;
};

/** POST /reports/generate için body (tarihler ISO string) */
export interface ReportGenerateBody {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  provinceIds?: string[];
  districtIds?: string[];
  status?: string;
}

// Tüm rapor verilerini tek seferde getir (backend'den)
export const fetchReportData = async (filters: ReportFilters): Promise<ReportData> => {
  const body = prepareReportBody(filters);
  const response = await httpClient.post<ReportData>('/reports/generate', body);
  return response.data;
};

// POST body hazırla (Date -> ISO string, undefined alanları gönderme)
function prepareReportBody(filters: ReportFilters): ReportGenerateBody {
  const body: ReportGenerateBody = {};
  if (filters.startDate) body.startDate = filters.startDate.toISOString();
  if (filters.endDate) body.endDate = filters.endDate.toISOString();
  if (filters.branchId) body.branchId = filters.branchId;
  if (filters.provinceIds?.length) body.provinceIds = filters.provinceIds;
  if (filters.districtIds?.length) body.districtIds = filters.districtIds;
  if (filters.status) body.status = filters.status;
  return body;
}

// GET query parametrelerini hazırla
function prepareQueryParams(filters: ReportFilters): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};
  if (filters.startDate) params.startDate = filters.startDate.toISOString();
  if (filters.endDate) params.endDate = filters.endDate.toISOString();
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.provinceIds?.length) params.provinceIds = filters.provinceIds.join(',');
  if (filters.districtIds?.length) params.districtIds = filters.districtIds.join(',');
  if (filters.status) params.status = filters.status;
  return params;
}

/**
 * Backend sadece GET endpoint'leri sunuyorsa: fetchReportData yerine
 * aşağıdaki gibi paralel çağrı kullanılabilir:
 *
 * const [kpis, memberReport, regionReport, applicationReport] = await Promise.all([
 *   fetchKPIs(filters),
 *   fetchMemberReport(filters),
 *   fetchRegionReport(filters),
 *   fetchApplicationReport(filters),
 * ]);
 */
