// src/types/member.ts

export type MemberStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'RESIGNED'
  | 'EXPELLED'
  | 'REJECTED';

export interface MemberListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  status: MemberStatus;
  province?: { id: string; name: string } | null;
  district?: { id: string; name: string } | null;
  duesPlan?: {
    id: string;
    name: string;
    amount: number | string;
  } | null;
  createdAt?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  cancelledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface MemberDetail extends MemberListItem {
  nationalId?: string | null;
  source?: 'DIRECT' | 'WORKPLACE' | 'DEALER' | 'OTHER';
  workplace?: { id: string; name: string } | null;
  dealer?: { id: string; name: string } | null;
  duesPlan?: {
    id: string;
    name: string;
    amount: number | string;
  } | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  previousCancelledMember?: {
    id: string;
    firstName: string;
    lastName: string;
    cancelledAt: string | null;
    cancellationReason: string | null;
    status: MemberStatus;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  approvedAt?: string | null;
  cancelledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  // backend'ten gelen diğer alanlar varsa burada genişletebilirsin
}

// 🔹 Üye başvurusu listesi (GET /members/applications)
export interface MemberApplicationRow {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  status: MemberStatus; // genelde PENDING
  createdAt: string;
  province?: { id: string; name: string } | null;
  district?: { id: string; name: string } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}
