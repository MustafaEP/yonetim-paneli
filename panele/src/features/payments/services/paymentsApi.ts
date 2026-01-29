// src/features/payments/services/paymentsApi.ts
import httpClient from '../../../shared/services/httpClient';

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

export interface UpdateMemberPaymentDto {
  memberId?: string;
  paymentDate?: string;
  paymentPeriodMonth?: number;
  paymentPeriodYear?: number;
  amount?: string;
  paymentType?: PaymentType;
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
  institutionId?: string;
  isApproved?: boolean;
  registrationNumber?: string;
}

// 🔹 Ödeme oluştur: POST /payments
export const createPayment = async (data: CreateMemberPaymentDto): Promise<MemberPayment> => {
  const res = await httpClient.post<MemberPayment>('/payments', data);
  return res.data;
};

// 🔹 Ödeme güncelle: PATCH /payments/:id
export const updatePayment = async (id: string, data: UpdateMemberPaymentDto): Promise<MemberPayment> => {
  const res = await httpClient.patch<MemberPayment>(`/payments/${id}`, data);
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

// 🔹 Ödeme evrakı yükle: POST /payments/upload-document
export const uploadPaymentDocument = async (
  file: File,
  memberId: string,
  paymentPeriodMonth: number,
  paymentPeriodYear: number,
  fileName?: string,
): Promise<{ fileUrl: string; fileName: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('memberId', memberId);
  formData.append('paymentPeriodMonth', paymentPeriodMonth.toString());
  formData.append('paymentPeriodYear', paymentPeriodYear.toString());
  if (fileName) {
    formData.append('fileName', fileName);
  }

  const res = await httpClient.post<{ fileUrl: string; fileName: string }>(
    '/payments/upload-document',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
};

// 🔹 Ödeme belgesi görüntüle (yeni sekmede aç)
export const viewPaymentDocument = async (paymentId: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
  const url = `${API_BASE_URL}/payments/${paymentId}/document/view`;
  
  // Yeni sekmede PDF'i aç
  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    throw new Error('Popup engellendi. Lütfen popup engelleyiciyi kapatın.');
  }

  // Token ile PDF'i yükle
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    newWindow.close();
    const errorText = await response.text();
    throw new Error(errorText || 'Dosya görüntülenemedi');
  }

  // Blob oluştur ve yeni sekmede göster
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  newWindow.location.href = blobUrl;
  
  // Blob URL'i temizle (yeni pencere kapandığında)
  newWindow.addEventListener('beforeunload', () => {
    window.URL.revokeObjectURL(blobUrl);
  });
};

// 🔹 Ödeme belgesi indir
export const downloadPaymentDocument = async (paymentId: string, fileName?: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
  const url = `${API_BASE_URL}/payments/${paymentId}/document/download`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Dosya indirilemedi');
  }

  // Dosya adını belirle: önce parametre olarak gelen, sonra header'dan, son olarak default
  let finalFileName = fileName || 'payment-document.pdf';
  
  if (!fileName) {
    // Response'dan dosya adını al
    const contentDisposition = response.headers.get('Content-Disposition');
    
    if (contentDisposition) {
      // Content-Disposition formatı: attachment; filename="dosya_adi.pdf" veya attachment; filename*=UTF-8''dosya_adi.pdf
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match && utf8Match[1]) {
        try {
          finalFileName = decodeURIComponent(utf8Match[1].trim());
        } catch (e) {
          console.warn('UTF-8 filename decode hatası:', e);
        }
      } else {
        const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (quotedMatch && quotedMatch[1]) {
          finalFileName = quotedMatch[1];
        } else {
          const unquotedMatch = contentDisposition.match(/filename=([^;]+)/i);
          if (unquotedMatch && unquotedMatch[1]) {
            finalFileName = unquotedMatch[1].trim().replace(/^["']|["']$/g, '');
          }
        }
      }
    }
  }

  // Blob oluştur ve indir
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};