// src/types/user.ts

export type Role =
  | 'ADMIN'
  | 'MODERATOR'
  | 'GENEL_BASKAN'
  | 'GENEL_BASKAN_YRD'
  | 'GENEL_SEKRETER'
  | 'IL_BASKANI'
  | 'ILCE_TEMSILCISI'
  | 'BAYI_YETKILISI'
  | 'UYE';

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
}

export interface UserDetail extends UserListItem {
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Uygulamada göstereceğimiz tüm roller
export const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MODERATOR', label: 'Moderatör' },
  { value: 'GENEL_BASKAN', label: 'Genel Başkan' },
  { value: 'GENEL_BASKAN_YRD', label: 'Genel Başkan Yardımcısı' },
  { value: 'GENEL_SEKRETER', label: 'Genel Sekreter' },
  { value: 'IL_BASKANI', label: 'İl Başkanı' },
  { value: 'ILCE_TEMSILCISI', label: 'İlçe Temsilcisi' },
  { value: 'BAYI_YETKILISI', label: 'Bayi Yetkilisi' },
  { value: 'UYE', label: 'Üye' },
];
