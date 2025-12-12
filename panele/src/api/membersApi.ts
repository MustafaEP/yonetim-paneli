// src/api/membersApi.ts
import httpClient from './httpClient';
import type {
  MemberListItem,
  MemberDetail,
  MemberApplicationRow,
} from '../types/member';

// 🔹 Aktif/Pasif üyeleri listele: GET /members
export const getMembers = async (): Promise<MemberListItem[]> => {
  const res = await httpClient.get<MemberListItem[]>('/members');
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
export const approveMember = async (id: string): Promise<void> => {
  await httpClient.post(`/members/${id}/approve`, {});
};

// 🔹 Başvuruyu reddet: POST /members/:id/reject
export const rejectMember = async (id: string): Promise<void> => {
  await httpClient.post(`/members/${id}/reject`, {});
};

// 🔹 Yeni üye başvurusu oluştur: POST /members/applications
export const createMemberApplication = async (payload: {
  firstName: string;
  lastName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  source?: 'DIRECT' | 'WORKPLACE' | 'DEALER' | 'OTHER';
  provinceId?: string;
  districtId?: string;
  workplaceId?: string;
  dealerId?: string;
  duesPlanId: string;
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
  } catch (e: any) {
    // 404 veya başka bir hata durumunda null döndür
    if (e?.response?.status === 404) {
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