// src/features/members/services/membersApi.ts
import httpClient from '../../../shared/services/httpClient';
import type {
  MemberListItem,
  MemberDetail,
  MemberApplicationRow,
  MemberStatus,
} from '../../../types/member';

// 🔹 Üyeleri listele: GET /members?status=ACTIVE&provinceId=...
export const getMembers = async (
  status?: MemberStatus,
  provinceId?: string,
): Promise<MemberListItem[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (provinceId && provinceId.trim() !== '') params.provinceId = provinceId;
  const res = await httpClient.get<MemberListItem[]>('/members', { params });
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Reddedilen üyeleri listele: GET /members/rejected
export const getRejectedMembers = async (): Promise<MemberListItem[]> => {
  const res = await httpClient.get<MemberListItem[]>('/members/rejected');
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Üye detayı: GET /members/:id
export const getMemberById = async (id: string): Promise<MemberDetail> => {
  const res = await httpClient.get<MemberDetail>(`/members/${id}`);
  return res.data;
};

// 🔹 Üye başvuruları: GET /members/applications
export const getMemberApplications = async (): Promise<MemberApplicationRow[]> => {
  const res = await httpClient.get<MemberApplicationRow[]>('/members/applications');
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Başvuruyu onayla: POST /members/:id/approve
export interface ApproveMemberResponse {
  emptyOptionalFields?: string[];
}
export const approveMember = async (
  id: string,
  data?: {
    registrationNumber?: string;
    boardDecisionDate?: string;
    boardDecisionBookNo?: string;
    tevkifatCenterId?: string;
    tevkifatTitleId?: string;
    branchId?: string;
    memberGroupId?: string;
  },
): Promise<ApproveMemberResponse> => {
  const res = await httpClient.post<ApproveMemberResponse>(`/members/${id}/approve`, data || {});
  return res.data;
};

// 🔹 Başvuruyu reddet: POST /members/:id/reject
export const rejectMember = async (id: string): Promise<void> => {
  await httpClient.post(`/members/${id}/reject`, {});
};

// 🔹 Onaylanmış üyeleri listele: GET /members/approved
export const getApprovedMembers = async (): Promise<MemberApplicationRow[]> => {
  const res = await httpClient.get<MemberApplicationRow[]>('/members/approved');
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Onaylanmış üyeyi aktifleştir: POST /members/:id/activate
export const activateMember = async (id: string): Promise<void> => {
  await httpClient.post(`/members/${id}/activate`, {});
};

// 🔹 Yeni üye başvurusu oluştur: POST /members/applications
export const createMemberApplication = async (payload: {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone?: string;
  email?: string;
  source?: 'DIRECT' | 'OTHER';
  membershipInfoOptionId?: string;
  memberGroupId?: string;
  registrationNumber?: string;
  boardDecisionDate?: string;
  boardDecisionBookNo?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string;
  birthplace?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  educationStatus?: 'PRIMARY' | 'HIGH_SCHOOL' | 'COLLEGE';
  institutionId?: string;
  tevkifatCenterId?: string;
  tevkifatTitleId?: string;
  branchId: string;
  provinceId?: string;
  districtId?: string;
  // Kurum Detay Bilgileri
  dutyUnit?: string;
  institutionAddress?: string;
  institutionProvinceId?: string;
  institutionDistrictId?: string;
  professionId?: string;
  institutionRegNo?: string;
  staffTitleCode?: string;
  previousCancelledMemberId?: string;
}): Promise<MemberDetail> => {
  const res = await httpClient.post<MemberDetail>('/members/applications', payload);
  return res.data;
};

// 🔹 Üye aidat planını güncelle: PATCH /members/:id/dues-plan
export const updateMemberDuesPlan = async (
  memberId: string,
  duesPlanId: string,
): Promise<MemberDetail> => {
  const res = await httpClient.patch<MemberDetail>(
    `/members/${memberId}/dues-plan`,
    { duesPlanId },
  );
  return res.data;
};

// 🔹 TC kimlik numarasına göre iptal edilmiş üye kontrolü: GET /members/check-national-id/:nationalId
export const checkCancelledMemberByNationalId = async (nationalId: string): Promise<MemberDetail | null> => {
  if (!nationalId || nationalId.trim().length === 0) {
    return null;
  }
  try {
    const res = await httpClient.get<MemberDetail>(`/members/check-national-id/${encodeURIComponent(nationalId.trim())}`);
    return res.data;
  } catch (e: unknown) {
    // 404 veya başka bir hata durumunda null döndür
    const err = e as { response?: { status?: number } };
    if (err?.response?.status === 404) {
      return null;
    }
    throw e;
  }
};

// 🔹 İptal edilen üyeleri listele: GET /members/cancelled
export const getCancelledMembers = async (): Promise<MemberListItem[]> => {
  const res = await httpClient.get<MemberListItem[]>('/members/cancelled');
  return Array.isArray(res.data) ? res.data : [];
};


// 🔹 Üyeliği iptal et: PATCH /members/:id/cancel
export const cancelMember = async (
  memberId: string,
  cancellationReason: string,
  status: 'RESIGNED' | 'EXPELLED' | 'INACTIVE',
): Promise<MemberDetail> => {
  const res = await httpClient.patch<MemberDetail>(
    `/members/${memberId}/cancel`,
    { cancellationReason, status },
  );
  return res.data;
};

// 🔹 Üye bilgilerini güncelle: PATCH /members/:id
export const updateMember = async (
  memberId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    membershipInfoOptionId?: string;
    registrationNumber?: string;
    boardDecisionDate?: string;
    boardDecisionBookNo?: string;
    motherName?: string;
    fatherName?: string;
    birthDate?: string;
    birthplace?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    educationStatus?: 'PRIMARY' | 'HIGH_SCHOOL' | 'COLLEGE';
    provinceId?: string;
    districtId?: string;
    institutionId?: string;
    tevkifatCenterId?: string;
    tevkifatTitleId?: string;
    branchId?: string;
    // Kurum Detay Bilgileri
    dutyUnit?: string;
    institutionAddress?: string;
    institutionProvinceId?: string;
    institutionDistrictId?: string;
    professionId?: string;
    institutionRegNo?: string;
    staffTitleCode?: string;
    status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'RESIGNED' | 'EXPELLED' | 'REJECTED';
    cancellationReason?: string;
  },
): Promise<MemberDetail> => {
  const res = await httpClient.patch<MemberDetail>(`/members/${memberId}`, data);
  return res.data;
};

// 🔹 Üye güncelleme geçmişini getir: GET /members/:id/history
export const getMemberHistory = async (memberId: string) => {
  const res = await httpClient.get(`/members/${memberId}/history`);
  return res.data;
};

// 🔹 Üyeleri PDF olarak export et: GET /members/export/pdf
export const exportMembersToPdf = async (): Promise<void> => {
  const res = await httpClient.get('/members/export/pdf', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `uyeler_${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 🔹 Üye detayını PDF olarak export et: GET /members/:id/export/pdf
export const exportMemberDetailToPdf = async (memberId: string): Promise<void> => {
  const res = await httpClient.get(`/members/${memberId}/export/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = res.headers['content-disposition'];
  let filename = `uye_detay_${memberId}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 🔹 Toplu üye import doğrulama: POST /imports/members/validate
export interface ValidateMemberImportRow {
  rowIndex: number;
  data: Record<string, string>;
  status: 'valid' | 'warning' | 'error';
  errors?: { column?: string; message: string }[];
}
export interface ValidateMemberImportResponse {
  totalRows: number;
  previewRows: ValidateMemberImportRow[];
  errors: { rowIndex: number; column?: string; message: string }[];
  summary: { valid: number; warning: number; error: number };
}
export const validateMemberImport = async (
  file: File,
): Promise<ValidateMemberImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpClient.post<ValidateMemberImportResponse>(
    '/imports/members/validate',
    formData,
  );
  return res.data;
};

// 🔹 Toplu üye CSV şablonu indir (Türkçe Excel uyumlu, örnek satır sistemdeki il/ilçe/kurum ile)
export const downloadMemberImportTemplate = async (): Promise<void> => {
  const res = await httpClient.get('/imports/members/template', {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = res.headers['content-disposition'];
  let filename = `toplu_uye_sablonu_${new Date().toISOString().split('T')[0]}.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+?)"?$/);
    if (match) filename = match[1].trim();
  }
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 🔹 10 rastgele üyeli örnek CSV indir (test için)
export const downloadSampleMembersCsv = async (): Promise<void> => {
  const res = await httpClient.get('/imports/members/sample-csv', {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = res.headers['content-disposition'];
  let filename = `ornek_10_uye_${new Date().toISOString().split('T')[0]}.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+?)"?$/);
    if (match) filename = match[1].trim();
  }
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 🔹 Toplu üye içe aktar: POST /imports/members/import
export interface BulkImportResponse {
  imported: number;
  skipped: number;
  errors: { rowIndex: number; column?: string; message: string }[];
  duplicateNationalIds: string[];
}
export const bulkImportMembers = async (
  file: File,
  skipErrors: boolean,
): Promise<BulkImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpClient.post<BulkImportResponse>(
    `/imports/members/import?skipErrors=${skipErrors}`,
    formData,
  );
  return res.data;
};

// 🔹 Üyeyi soft delete et: DELETE /members/:id
export const deleteMember = async (
  memberId: string,
  options?: {
    deletePayments?: boolean;
    deleteDocuments?: boolean;
  },
): Promise<void> => {
  await httpClient.delete(`/members/${memberId}`, {
    data: options,
  });
};