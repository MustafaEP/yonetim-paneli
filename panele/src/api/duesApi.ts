// src/api/duesApi.ts
import httpClient from './httpClient';
import type {
  DuesPlanRow,
  DuesDebtRow,
  MemberPaymentRow,
  DuesSummary,
  DuesDebtItem,
  DuesByMonthItem,
  MemberPayment,
} from '../types/dues';

// 🔹 Aidat planları
export const getDuesPlans = async (
  includeInactive = false,
): Promise<DuesPlanRow[]> => {
  const res = await httpClient.get<DuesPlanRow[]>('/dues/plans', {
    params: { includeInactive },
  });

  const data = res.data;
  return (Array.isArray(data) ? data : []).map((p) => ({
    ...p,
    amount:
      typeof p.amount === 'number'
        ? p.amount
        : Number((p as any).amount ?? 0),
  }));
};

export const createDuesPlan = async (payload: {
  name: string;
  description?: string;
  amount: number;
  period: 'MONTHLY' | 'YEARLY';
}): Promise<DuesPlanRow> => {
  const res = await httpClient.post<DuesPlanRow>('/dues/plans', payload);
  const p = res.data;
  return {
    ...p,
    amount:
      typeof p.amount === 'number'
        ? p.amount
        : Number((p as any).amount ?? 0),
  };
};

export const updateDuesPlan = async (
  id: string,
  payload: {
    name: string;
    description?: string;
    amount: number;
    period: 'MONTHLY' | 'YEARLY';
    isActive: boolean;
  },
): Promise<DuesPlanRow> => {
  const res = await httpClient.put<DuesPlanRow>(`/dues/plans/${id}`, payload);
  const p = res.data;
  return {
    ...p,
    amount:
      typeof p.amount === 'number'
        ? p.amount
        : Number((p as any).amount ?? 0),
  };
};

export const deleteDuesPlan = async (id: string): Promise<void> => {
  await httpClient.delete(`/dues/plans/${id}`);
};

// 🔹 Borçlu üyeler
export const getDuesDebts = async (
  since?: string,
): Promise<DuesDebtRow[]> => {
  const res = await httpClient.get<DuesDebtRow[]>('/dues/reports/debts', {
    params: since ? { since } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Üye ödemeleri: GET /dues/members/:memberId/payments
export const getMemberPayments = async (
  memberId: string,
): Promise<MemberPaymentRow[]> => {
  const res = await httpClient.get<MemberPaymentRow[]>(
    `/dues/members/${memberId}/payments`,
  );
  const data = res.data;
  return (Array.isArray(data) ? data : []).map((p) => ({
    ...p,
    amount:
      typeof p.amount === 'number'
        ? p.amount
        : Number((p as any).amount ?? 0),
    // appliedMonths'ı koru (backend'den geliyorsa)
    appliedMonths: (p as any).appliedMonths || null,
    // excessAmount'ı koru (backend'den geliyorsa)
    excessAmount: (p as any).excessAmount || null,
  }));
};

// 🔹 Ödeme ekleme: POST /dues/payments
export const addDuesPayment = async (payload: {
  memberId: string;
  planId?: string;
  amount: number;
  periodYear?: number;
  periodMonth?: number;
  note?: string;
}): Promise<MemberPaymentRow> => {
  const res = await httpClient.post<MemberPaymentRow>('/dues/payments', payload);
  const p = res.data;
  return {
    ...p,
    amount:
      typeof p.amount === 'number'
        ? p.amount
        : Number((p as any).amount ?? 0),
  };
};

// 🔹 Dashboard özeti: GET /dues/reports/summary
export const getDuesSummary = async (): Promise<DuesSummary> => {
  const res = await httpClient.get<DuesSummary>('/dues/reports/summary');
  const d = res.data;

  // null/undefined durumlarına karşı normalize edelim
  const safe: DuesSummary = {
    totalPayments:
      typeof d.totalPayments === 'number'
        ? d.totalPayments
        : Number((d as any).totalPayments ?? 0),
    totalMembers: d.totalMembers ?? 0,
    paidMembers: d.paidMembers ?? 0,
    unpaidMembers: d.unpaidMembers ?? 0,
    newMembersThisMonth: d.newMembersThisMonth ?? 0,
    cancelledMembersThisMonth: d.cancelledMembersThisMonth ?? 0,
    byMonth: Array.isArray(d.byMonth)
      ? d.byMonth.map((m) => ({
          month: m.month ?? 0,
          year: m.year ?? 0,
          total:
            typeof m.total === 'number'
              ? m.total
              : Number((m as any).total ?? 0),
          count: m.count ?? 0,
        }))
      : [],
  };

  return safe;
};

// GET /dues/reports/debts?since=YYYY-MM-DD
export const getDebtsReport = async (params?: {
  since?: string;
}): Promise<DuesDebtItem[]> => {
  const res = await httpClient.get<DuesDebtItem[]>('/dues/reports/debts', {
    params,
  });
  return Array.isArray(res.data) ? res.data : [];
};

// 🔹 Üye borç bilgisi: GET /dues/members/:memberId/debt
export const getMemberDebt = async (
  memberId: string,
): Promise<DuesDebtRow> => {
  const res = await httpClient.get<DuesDebtRow>(
    `/dues/members/${memberId}/debt`,
  );
  return res.data;
};

// 🔹 Üye aylık borç durumu: GET /dues/members/:memberId/monthly-debts?year=2025
export interface MonthlyDebtStatus {
  memberId: string;
  year: number;
  planAmount: number;
  months: Array<{
    month: number;
    monthName: string;
    amount: number;
    isPaid: boolean;
    paymentId?: string;
    paidAt?: string;
  }>;
}

export const getMemberMonthlyDebts = async (
  memberId: string,
  year?: number,
): Promise<MonthlyDebtStatus> => {
  const res = await httpClient.get<MonthlyDebtStatus>(
    `/dues/members/${memberId}/monthly-debts`,
    {
      params: year ? { year } : undefined,
    },
  );
  return res.data;
};

// 🔹 Aylık tahsilat raporu: GET /dues/reports/monthly
export const getMonthlyPaymentsReport = async (): Promise<DuesByMonthItem[]> => {
  const res = await httpClient.get<DuesByMonthItem[]>('/dues/reports/monthly');
  return Array.isArray(res.data) ? res.data : [];
};