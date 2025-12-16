// src/api/paymentsApi.ts
import httpClient from './httpClient';

export type PaymentType = 'TEVKIFAT' | 'ELDEN' | 'HAVALE';

export interface MemberPayment {
  id: string;
  memberId: string;
  registrationNumber: string | null;
  paymentDate: string;
  paymentPeriodMonth: number;
  paymentPeriodYear: number;
  amount: string;
  paymentType: PaymentType;
  tevkifatCenterId: string | null;
  tevkifatCenter: {
    id: string;
    name: string;
  } | null;
  tevkifatFileId: string | null;
  description: string | null;
  documentUrl: string | null;
  isApproved: boolean;
  approvedByUserId: string | null;
  approvedByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  approvedAt: string | null;
  createdByUserId: string;
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNumber: string | null;
    branch?: {
      id: string;
      name: string;
    };
    institution?: {
      id: string;
      name: string;
    };
    tevkifatCenter?: {
      id: string;
      name: string;
    };
    province?: {
      id: string;
      name: string;
    };
    district?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateMemberPaymentDto {
  memberId: string;
  paymentDate?: string;
  paymentPeriodMonth: number;
  paymentPeriodYear: number;
  amount: string;
  paymentType: PaymentType;
  tevkifatCenterId?: string;
  tevkifatFileId?: string;
  description?: string;
  documentUrl?: string;
}

export interface PaymentListFilters {
  memberId?: string;
  year?: number;
  month?: number;
  paymentType?: PaymentType;
  tevkifatCenterId?: string;
  branchId?: string;
  provinceId?: string;
  districtId?: string;
  isApproved?: boolean;
  registrationNumber?: string;
}

// 🔹 Ödeme oluştur: POST /payments
export const createPayment = async (data: CreateMemberPaymentDto): Promise<MemberPayment> => {
  const res = await httpClient.post<MemberPayment>('/payments', data);
  return res.data;
};

// 🔹 Ödeme listesi: GET /payments
export const getPayments = async (filters?: PaymentListFilters): Promise<MemberPayment[]> => {
  const res = await httpClient.get<MemberPayment[]>('/payments', { params: filters });
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Üye ödemeleri: GET /payments/member/:memberId
export const getMemberPayments = async (memberId: string): Promise<MemberPayment[]> => {
  const res = await httpClient.get<MemberPayment[]>(`/payments/member/${memberId}`);
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Ödeme detayı: GET /payments/:id
export const getPaymentById = async (id: string): Promise<MemberPayment> => {
  const res = await httpClient.get<MemberPayment>(`/payments/${id}`);
  return res.data;
};

// 🔹 Ödemeyi onayla: POST /payments/:id/approve
export const approvePayment = async (id: string): Promise<MemberPayment> => {
  const res = await httpClient.post<MemberPayment>(`/payments/${id}/approve`, {});
  return res.data;
};

// 🔹 Ödemeyi sil: DELETE /payments/:id
export const deletePayment = async (id: string): Promise<void> => {
  await httpClient.delete(`/payments/${id}`);
};

// 🔹 Muhasebe ödeme listesi: GET /payments/accounting/list
export const getPaymentsForAccounting = async (filters?: {
  branchId?: string;
  tevkifatCenterId?: string;
  year?: number;
  month?: number;
  isApproved?: boolean;
}): Promise<MemberPayment[]> => {
  const res = await httpClient.get<MemberPayment[]>('/payments/accounting/list', { params: filters });
  return Array.isArray(res.data) ? res.data : [];
};
