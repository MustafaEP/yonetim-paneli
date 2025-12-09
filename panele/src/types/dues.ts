// src/types/dues.ts

export type DuesPeriod = 'MONTHLY' | 'YEARLY';

export interface DuesPlan {
  id: string;
  name: string;
  description?: string | null;
  amount: string; // backend decimal string döndürüyor
  period: DuesPeriod;
  isActive: boolean;
}

export interface MemberPayment {
  id: string;
  amount: string;
  paidAt: string; // ISO date string
  periodYear?: number | null;
  periodMonth?: number | null;
  note?: string | null;
  plan?: {
    id: string;
    name: string;
  } | null;
}

// 🔹 /dues/reports/summary yanıtı
export interface DuesSummaryByMonth {
  month: number;
  year: number;
  total: number;
  count: number;
}

export interface DuesSummary {
  totalPayments: number;
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  byMonth: DuesSummaryByMonth[];
}


export interface DuesPlanRow {
  id: string;
  name: string;
  description?: string | null;
  amount: number; // backend string dönerse frontende çeviririz
  period: 'MONTHLY' | 'YEARLY';
  isActive: boolean;
}

export interface DuesDebtRow {
  memberId: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lastPaymentDate: string | null;
  monthsOverdue: number;
  totalDebt: number;
}

// 🔹 Üye ödeme satırı (GET /dues/members/:memberId/payments)
export interface MemberPaymentRow {
  id: string;
  amount: number; // backend string dönerse dönüştürülecek
  paidAt: string;
  periodYear?: number | null;
  periodMonth?: number | null;
  note?: string | null;
  plan?: {
    id: string;
    name: string;
  } | null;
}

// 🔹 Dashboard ödeme özeti (GET /dues/reports/summary)
export interface DuesSummary {
  totalPayments: number;
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  byMonth: {
    month: number;
    year: number;
    total: number;
    count: number;
  }[];
}

// 🔹 Aidat summary tipleri
export interface DuesByMonthItem {
  month: number; // 1-12
  year: number;
  total: number; // toplam tahsilat
  count: number; // ödeme adedi
}

export interface DuesSummary {
  totalPayments: number;
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  byMonth: DuesByMonthItem[];
}

// 🔹 Borçlu üyeler raporu tipi
export interface DuesDebtItem {
  memberId: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lastPaymentDate: string | null;
  monthsOverdue: number;
  totalDebt: number;
}