// src/types/role.ts

export type Permission =
  | 'USER_LIST'
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_SOFT_DELETE'
  | 'USER_ASSIGN_ROLE'
  | 'ROLE_LIST'
  | 'ROLE_VIEW'
  | 'ROLE_CREATE'
  | 'ROLE_UPDATE'
  | 'ROLE_DELETE'
  | 'ROLE_MANAGE_PERMISSIONS'
  | 'MEMBER_LIST'
  | 'MEMBER_VIEW'
  | 'MEMBER_CREATE_APPLICATION'
  | 'MEMBER_APPROVE'
  | 'MEMBER_REJECT'
  | 'MEMBER_UPDATE'
  | 'MEMBER_STATUS_CHANGE'
  | 'MEMBER_LIST_BY_PROVINCE'
  | 'DUES_PLAN_MANAGE'
  | 'DUES_PAYMENT_ADD'
  | 'DUES_REPORT_VIEW'
  | 'DUES_DEBT_LIST_VIEW'
  | 'DUES_EXPORT'
  | 'REGION_LIST'
  | 'BRANCH_MANAGE'
  | 'BRANCH_ASSIGN_PRESIDENT'
  | 'WORKPLACE_LIST'
  | 'WORKPLACE_MANAGE'
  | 'WORKPLACE_ASSIGN_REP'
  | 'WORKPLACE_MEMBERS_VIEW'
  | 'DEALER_LIST'
  | 'DEALER_CREATE'
  | 'DEALER_APPROVE_APPLICATION'
  | 'DEALER_UPDATE'
  | 'DEALER_PERFORMANCE_VIEW'
  | 'CONTENT_MANAGE'
  | 'CONTENT_PUBLISH'
  | 'DOCUMENT_TEMPLATE_MANAGE'
  | 'DOCUMENT_MEMBER_HISTORY_VIEW'
  | 'DOCUMENT_GENERATE_PDF'
  | 'REPORT_GLOBAL_VIEW'
  | 'REPORT_REGION_VIEW'
  | 'REPORT_MEMBER_STATUS_VIEW'
  | 'REPORT_DUES_VIEW'
  | 'NOTIFY_ALL_MEMBERS'
  | 'NOTIFY_REGION'
  | 'NOTIFY_OWN_SCOPE'
  | 'SYSTEM_SETTINGS_VIEW'
  | 'SYSTEM_SETTINGS_MANAGE'
  | 'LOG_VIEW_ALL'
  | 'LOG_VIEW_OWN_SCOPE';

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: Permission[];
  provinceId?: string;
  province?: {
    id: string;
    name: string;
    code?: string;
  };
  districtId?: string;
  district?: {
    id: string;
    name: string;
    provinceId: string;
  };
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface SystemRole {
  name: string;
  permissions: Permission[];
  isSystemRole: true;
}

export type RoleListItem = CustomRole | SystemRole;

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: Permission[];
  provinceId?: string;
  districtId?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  provinceId?: string;
  districtId?: string;
}

export interface UpdateRolePermissionsDto {
  permissions: Permission[];
}

// İzin grupları (UI'da kategorize etmek için)
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    'USER_LIST',
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_SOFT_DELETE',
    'USER_ASSIGN_ROLE',
  ] as Permission[],
  ROLE_MANAGEMENT: [
    'ROLE_LIST',
    'ROLE_VIEW',
    'ROLE_CREATE',
    'ROLE_UPDATE',
    'ROLE_DELETE',
    'ROLE_MANAGE_PERMISSIONS',
  ] as Permission[],
  MEMBER_MANAGEMENT: [
    'MEMBER_LIST',
    'MEMBER_VIEW',
    'MEMBER_CREATE_APPLICATION',
    'MEMBER_APPROVE',
    'MEMBER_REJECT',
    'MEMBER_UPDATE',
    'MEMBER_STATUS_CHANGE',
    'MEMBER_LIST_BY_PROVINCE',
  ] as Permission[],
  DUES_MANAGEMENT: [
    'DUES_PLAN_MANAGE',
    'DUES_PAYMENT_ADD',
    'DUES_REPORT_VIEW',
    'DUES_DEBT_LIST_VIEW',
    'DUES_EXPORT',
  ] as Permission[],
  REGION_MANAGEMENT: [
    'REGION_LIST',
    'BRANCH_MANAGE',
    'BRANCH_ASSIGN_PRESIDENT',
    'WORKPLACE_LIST',
    'WORKPLACE_MANAGE',
    'WORKPLACE_ASSIGN_REP',
    'WORKPLACE_MEMBERS_VIEW',
    'DEALER_LIST',
    'DEALER_CREATE',
    'DEALER_APPROVE_APPLICATION',
    'DEALER_UPDATE',
    'DEALER_PERFORMANCE_VIEW',
  ] as Permission[],
  CONTENT_MANAGEMENT: [
    'CONTENT_MANAGE',
    'CONTENT_PUBLISH',
  ] as Permission[],
  DOCUMENT_MANAGEMENT: [
    'DOCUMENT_TEMPLATE_MANAGE',
    'DOCUMENT_MEMBER_HISTORY_VIEW',
    'DOCUMENT_GENERATE_PDF',
  ] as Permission[],
  REPORTS: [
    'REPORT_GLOBAL_VIEW',
    'REPORT_REGION_VIEW',
    'REPORT_MEMBER_STATUS_VIEW',
    'REPORT_DUES_VIEW',
  ] as Permission[],
  NOTIFICATIONS: [
    'NOTIFY_ALL_MEMBERS',
    'NOTIFY_REGION',
    'NOTIFY_OWN_SCOPE',
  ] as Permission[],
  SYSTEM: [
    'SYSTEM_SETTINGS_VIEW',
    'SYSTEM_SETTINGS_MANAGE',
    'LOG_VIEW_ALL',
    'LOG_VIEW_OWN_SCOPE',
  ] as Permission[],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  USER_LIST: 'Kullanıcıları Listele',
  USER_VIEW: 'Kullanıcı Detayı Görüntüle',
  USER_CREATE: 'Kullanıcı Oluştur',
  USER_UPDATE: 'Kullanıcı Güncelle',
  USER_SOFT_DELETE: 'Kullanıcı Sil',
  USER_ASSIGN_ROLE: 'Kullanıcıya Rol Ata',
  ROLE_LIST: 'Rolleri Listele',
  ROLE_VIEW: 'Rol Detayı Görüntüle',
  ROLE_CREATE: 'Rol Oluştur',
  ROLE_UPDATE: 'Rol Güncelle',
  ROLE_DELETE: 'Rol Sil',
  ROLE_MANAGE_PERMISSIONS: 'Rol İzinlerini Yönet',
  MEMBER_LIST: 'Üyeleri Listele',
  MEMBER_VIEW: 'Üye Detayı Görüntüle',
  MEMBER_CREATE_APPLICATION: 'Üyelik Başvurusu Oluştur',
  MEMBER_APPROVE: 'Üyelik Başvurusu Onayla',
  MEMBER_REJECT: 'Üyelik Başvurusu Reddet',
  MEMBER_UPDATE: 'Üye Güncelle',
  MEMBER_STATUS_CHANGE: 'Üye Durumu Değiştir',
  MEMBER_LIST_BY_PROVINCE: 'Belirli İldeki Üyeleri Görüntüleme',
  DUES_PLAN_MANAGE: 'Aidat Planı Yönet',
  DUES_PAYMENT_ADD: 'Aidat Ödemesi Ekle',
  DUES_REPORT_VIEW: 'Aidat Raporu Görüntüle',
  DUES_DEBT_LIST_VIEW: 'Borçlu Üyeleri Görüntüle',
  DUES_EXPORT: 'Aidat Verilerini Dışa Aktar',
  REGION_LIST: 'Bölgeleri Listele',
  BRANCH_MANAGE: 'Şube Yönet',
  BRANCH_ASSIGN_PRESIDENT: 'Şube Başkanı Ata',
  WORKPLACE_LIST: 'İş Yerlerini Listele',
  WORKPLACE_MANAGE: 'İş Yeri Yönet',
  WORKPLACE_ASSIGN_REP: 'İş Yeri Temsilcisi Ata',
  WORKPLACE_MEMBERS_VIEW: 'İş Yeri Üyelerini Görüntüle',
  DEALER_LIST: 'Bayileri Listele',
  DEALER_CREATE: 'Bayi Oluştur',
  DEALER_APPROVE_APPLICATION: 'Bayi Başvurusu Onayla',
  DEALER_UPDATE: 'Bayi Güncelle',
  DEALER_PERFORMANCE_VIEW: 'Bayi Performansını Görüntüle',
  CONTENT_MANAGE: 'İçerik Yönet',
  CONTENT_PUBLISH: 'İçerik Yayınla',
  DOCUMENT_TEMPLATE_MANAGE: 'Doküman Şablonu Yönet',
  DOCUMENT_MEMBER_HISTORY_VIEW: 'Üye Doküman Geçmişini Görüntüle',
  DOCUMENT_GENERATE_PDF: 'PDF Oluştur',
  REPORT_GLOBAL_VIEW: 'Genel Rapor Görüntüle',
  REPORT_REGION_VIEW: 'Bölge Raporu Görüntüle',
  REPORT_MEMBER_STATUS_VIEW: 'Üye Durum Raporu Görüntüle',
  REPORT_DUES_VIEW: 'Aidat Raporu Görüntüle',
  NOTIFY_ALL_MEMBERS: 'Tüm Üyelere Bildirim Gönder',
  NOTIFY_REGION: 'Bölgeye Bildirim Gönder',
  NOTIFY_OWN_SCOPE: 'Kendi Kapsamına Bildirim Gönder',
  SYSTEM_SETTINGS_VIEW: 'Sistem Ayarlarını Görüntüle',
  SYSTEM_SETTINGS_MANAGE: 'Sistem Ayarlarını Yönet',
  LOG_VIEW_ALL: 'Tüm Logları Görüntüle',
  LOG_VIEW_OWN_SCOPE: 'Kendi Kapsamı Loglarını Görüntüle',
};

