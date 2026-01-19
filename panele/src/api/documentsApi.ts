// src/api/documentsApi.ts
import httpClient from './httpClient';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  type: 'MEMBER_CERTIFICATE' | 'MEMBER_CARD' | 'LETTER' | 'RESIGNATION_LETTER' | 'EXPULSION_LETTER' | 'APPROVAL_CERTIFICATE' | 'INVITATION_LETTER' | 'CONGRATULATION_LETTER' | 'WARNING_LETTER' | 'NOTIFICATION_LETTER' | 'MEMBERSHIP_APPLICATION' | 'TRANSFER_CERTIFICATE' | 'OTHER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberDocument {
  id: string;
  memberId: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber?: string;
  };
  templateId?: string;
  template?: DocumentTemplate;
  documentType: string;
  fileName: string;
  fileUrl: string;
  generatedAt: string;
  generatedBy: string;
  generatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateDocumentTemplateDto {
  name: string;
  description?: string;
  template: string;
  type: 'MEMBER_CERTIFICATE' | 'MEMBER_CARD' | 'LETTER' | 'RESIGNATION_LETTER' | 'EXPULSION_LETTER' | 'APPROVAL_CERTIFICATE' | 'INVITATION_LETTER' | 'CONGRATULATION_LETTER' | 'WARNING_LETTER' | 'NOTIFICATION_LETTER' | 'MEMBERSHIP_APPLICATION' | 'TRANSFER_CERTIFICATE' | 'OTHER';
}

export interface UpdateDocumentTemplateDto {
  name?: string;
  description?: string;
  template?: string;
  type?: 'MEMBER_CERTIFICATE' | 'MEMBER_CARD' | 'LETTER' | 'OTHER';
  isActive?: boolean;
}

export interface GenerateDocumentDto {
  memberId: string;
  templateId: string;
  variables?: Record<string, string>;
  fileName?: string;
}

// Doküman şablonları
export const getDocumentTemplates = async (): Promise<DocumentTemplate[]> => {
  const res = await httpClient.get<DocumentTemplate[]>('/documents/templates');
  return Array.isArray(res.data) ? res.data : [];
};

export const getDocumentTemplateById = async (
  id: string,
): Promise<DocumentTemplate> => {
  const res = await httpClient.get<DocumentTemplate>(`/documents/templates/${id}`);
  return res.data;
};

export const createDocumentTemplate = async (
  payload: CreateDocumentTemplateDto,
): Promise<DocumentTemplate> => {
  const res = await httpClient.post<DocumentTemplate>('/documents/templates', payload);
  return res.data;
};

export const updateDocumentTemplate = async (
  id: string,
  payload: UpdateDocumentTemplateDto,
): Promise<DocumentTemplate> => {
  const res = await httpClient.put<DocumentTemplate>(
    `/documents/templates/${id}`,
    payload,
  );
  return res.data;
};

export const deleteDocumentTemplate = async (id: string): Promise<void> => {
  await httpClient.delete(`/documents/templates/${id}`);
};

// Üye doküman geçmişi
export const getMemberDocuments = async (
  memberId: string,
): Promise<MemberDocument[]> => {
  const res = await httpClient.get<MemberDocument[]>(
    `/documents/members/${memberId}`,
  );
  return Array.isArray(res.data) ? res.data : [];
};

// Doküman yükle
export const uploadMemberDocument = async (
  memberId: string,
  file: File,
  documentType: string,
  description?: string,
  fileName?: string,
): Promise<MemberDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (description) {
    formData.append('description', description);
  }
  if (fileName) {
    formData.append('fileName', fileName);
  }

  const res = await httpClient.post<MemberDocument>(
    `/documents/members/${memberId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
};

// PDF görüntüle (yeni sekmede aç)
export const viewDocument = async (documentId: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
  const url = `${API_BASE_URL}/documents/view/${documentId}`;
  
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

// PDF oluştur
export const generateDocument = async (
  payload: GenerateDocumentDto,
): Promise<MemberDocument> => {
  const res = await httpClient.post<MemberDocument>('/documents/generate', payload);
  return res.data;
};

// PDF indir
export const downloadDocument = async (documentId: string, fileName?: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
  const url = `${API_BASE_URL}/documents/download/${documentId}`;
  
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
  let finalFileName = fileName || 'document.pdf';
  
  if (!fileName) {
    // Response'dan dosya adını al
    const contentDisposition = response.headers.get('Content-Disposition');
    
    if (contentDisposition) {
      // Content-Disposition formatı: attachment; filename="dosya_adi.pdf" veya attachment; filename*=UTF-8''dosya_adi.pdf
      // Önce filename*=UTF-8'' formatını kontrol et (RFC 5987)
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match && utf8Match[1]) {
        try {
          finalFileName = decodeURIComponent(utf8Match[1].trim());
        } catch (e) {
          console.warn('UTF-8 filename decode hatası:', e);
        }
      } else {
        // Sonra normal filename="..." formatını kontrol et
        const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (quotedMatch && quotedMatch[1]) {
          finalFileName = quotedMatch[1];
        } else {
          // Son olarak filename=... formatını kontrol et (tırnak olmadan)
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

