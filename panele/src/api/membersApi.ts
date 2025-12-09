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
}): Promise<MemberDetail> => {
  const res = await httpClient.post<MemberDetail>('/members/applications', payload);
  return res.data;
};