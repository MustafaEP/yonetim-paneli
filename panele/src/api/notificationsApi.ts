// src/api/notificationsApi.ts
import httpClient from './httpClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  targetType: 'ALL_MEMBERS' | 'REGION' | 'SCOPE';
  targetId?: string;
  targetName?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  sentBy: string;
  sentByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  recipientCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
}

export interface SendNotificationDto {
  title: string;
  message: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  targetType: 'ALL_MEMBERS' | 'REGION' | 'SCOPE';
  targetId?: string;
}

// Bildirim gönder
export const sendNotification = async (
  payload: SendNotificationDto,
): Promise<Notification> => {
  const res = await httpClient.post<Notification>('/notifications/send', payload);
  return res.data;
};

// Bildirim geçmişi
export const getNotifications = async (params?: {
  targetType?: 'ALL_MEMBERS' | 'REGION' | 'SCOPE';
  status?: 'PENDING' | 'SENT' | 'FAILED';
}): Promise<Notification[]> => {
  const res = await httpClient.get<Notification[]>('/notifications', { params });
  return Array.isArray(res.data) ? res.data : [];
};

// Bildirim detayı
export const getNotificationById = async (id: string): Promise<Notification> => {
  const res = await httpClient.get<Notification>(`/notifications/${id}`);
  return res.data;
};

