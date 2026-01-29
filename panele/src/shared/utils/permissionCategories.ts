// src/shared/utils/permissionCategories.ts
// Permission kategorileri ve açıklamaları

export interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  permissions: string[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'USER_MANAGEMENT',
    label: 'Kullanıcı Yönetimi',
    description: 'Panel kullanıcılarını yönetme yetkileri',
    permissions: [
      'USER_LIST',
      'USER_VIEW',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_SOFT_DELETE',
      'USER_ASSIGN_ROLE',
    ],
  },
  {
    id: 'ROLE_MANAGEMENT',
    label: 'Rol & Yetki Yönetimi',
    description: 'Roller ve izinleri yönetme yetkileri',
    permissions: [
      'ROLE_LIST',
      'ROLE_VIEW',
      'ROLE_CREATE',
      'ROLE_UPDATE',
      'ROLE_DELETE',
      'ROLE_MANAGE_PERMISSIONS',
    ],
  },
  {
    id: 'MEMBER_MANAGEMENT',
    label: 'Üye Yönetimi',
    description: 'Üye kayıt, onay ve yönetim yetkileri',
    permissions: [
      'MEMBER_LIST',
      'MEMBER_VIEW',
      'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE',
      'MEMBER_REJECT',
      'MEMBER_UPDATE',
      'MEMBER_STATUS_CHANGE',
      'MEMBER_LIST_BY_PROVINCE',
    ],
  },
  {
    id: 'REGION_MANAGEMENT',
    label: 'Bölge & Şube Yönetimi',
    description: 'İl, ilçe, şube ve bölge yönetim yetkileri',
    permissions: [
      'REGION_LIST',
      'BRANCH_MANAGE',
      'BRANCH_ASSIGN_PRESIDENT',
    ],
  },
  {
    id: 'CONTENT_MANAGEMENT',
    label: 'İçerik Yönetimi',
    description: 'Haber, duyuru ve etkinlik yönetim yetkileri',
    permissions: [
      'CONTENT_MANAGE',
      'CONTENT_PUBLISH',
    ],
  },
  {
    id: 'DOCUMENT_MANAGEMENT',
    label: 'Evrak & Doküman',
    description: 'Doküman şablon ve geçmiş yönetim yetkileri',
    permissions: [
      'DOCUMENT_TEMPLATE_MANAGE',
      'DOCUMENT_MEMBER_HISTORY_VIEW',
      'DOCUMENT_GENERATE_PDF',
    ],
  },
  {
    id: 'REPORTS',
    label: 'Raporlar & Dashboard',
    description: 'Rapor görüntüleme ve analiz yetkileri',
    permissions: [
      'REPORT_GLOBAL_VIEW',
      'REPORT_REGION_VIEW',
      'REPORT_MEMBER_STATUS_VIEW',
      'REPORT_DUES_VIEW',
    ],
  },
  {
    id: 'NOTIFICATIONS',
    label: 'Bildirim & İletişim',
    description: 'Toplu bildirim gönderme yetkileri',
    permissions: [
      'NOTIFY_ALL_MEMBERS',
      'NOTIFY_REGION',
      'NOTIFY_OWN_SCOPE',
    ],
  },
  {
    id: 'SYSTEM',
    label: 'Sistem Ayarları & Loglar',
    description: 'Sistem konfigürasyonu ve log görüntüleme yetkileri',
    permissions: [
      'SYSTEM_SETTINGS_VIEW',
      'SYSTEM_SETTINGS_MANAGE',
      'LOG_VIEW_ALL',
      'LOG_VIEW_OWN_SCOPE',
    ],
  },
  {
    id: 'INSTITUTIONS',
    label: 'Kurumlar',
    description: 'Kurum yönetim yetkileri',
    permissions: [
      'INSTITUTION_LIST',
      'INSTITUTION_VIEW',
      'INSTITUTION_CREATE',
      'INSTITUTION_UPDATE',
      'INSTITUTION_APPROVE',
    ],
  },
  {
    id: 'ACCOUNTING',
    label: 'Muhasebe',
    description: 'Muhasebe ve tevkifat yönetim yetkileri',
    permissions: [
      'ACCOUNTING_VIEW',
      'ACCOUNTING_EXPORT',
      'TEVKIFAT_FILE_UPLOAD',
      'TEVKIFAT_FILE_APPROVE',
    ],
  },
  {
    id: 'PAYMENTS',
    label: 'Üye Ödemeleri',
    description: 'Ödeme girişi ve onaylama yetkileri',
    permissions: [
      'MEMBER_PAYMENT_ADD',
      'MEMBER_PAYMENT_APPROVE',
      'MEMBER_PAYMENT_LIST',
      'MEMBER_PAYMENT_VIEW',
    ],
  },
  {
    id: 'APPROVALS',
    label: 'Onay Süreçleri',
    description: 'Genel onay süreçleri yetkileri',
    permissions: [
      'APPROVAL_VIEW',
      'APPROVAL_APPROVE',
      'APPROVAL_REJECT',
    ],
  },
  {
    id: 'PANEL_USER_APPLICATIONS',
    label: 'Panel Kullanıcı Başvuruları',
    description: 'Üyelerin panel kullanıcılığına terfi başvurularını yönetme yetkileri',
    permissions: [
      'PANEL_USER_APPLICATION_CREATE',
      'PANEL_USER_APPLICATION_LIST',
      'PANEL_USER_APPLICATION_VIEW',
      'PANEL_USER_APPLICATION_APPROVE',
      'PANEL_USER_APPLICATION_REJECT',
    ],
  },
];

export const getPermissionCategory = (permission: string): PermissionCategory | undefined => {
  return PERMISSION_CATEGORIES.find((cat) => cat.permissions.includes(permission));
};

export const getPermissionLabel = (permission: string): string => {
  // Permission key'ini okunabilir bir label'a çevir
  return permission
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};
