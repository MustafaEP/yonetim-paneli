// src/types/user.ts

export type Role =
  | 'ADMIN'
  | 'MODERATOR'
  | 'GENEL_BASKAN'
  | 'GENEL_BASKAN_YRD'
  | 'GENEL_SEKRETER'
  | 'IL_BASKANI'
  | 'ILCE_TEMSILCISI'
  | 'ISYERI_TEMSILCISI'
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
