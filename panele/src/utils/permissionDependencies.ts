// src/utils/permissionDependencies.ts
import type { Permission } from '../types/role';

/**
 * Permission Dependency Map
 * 
 * Bu dosya, hangi izinlerin hangi izinleri gerektirdiğini tanımlar.
 * Örneğin: MEMBER_CREATE_APPLICATION izni, kurum seçimi yapabilmek için
 * INSTITUTION_LIST iznini gerektirir.
 */
export const PERMISSION_DEPENDENCIES: Record<Permission, Permission[]> = {
  // Kullanıcı Yönetimi
  USER_LIST: [],
  USER_VIEW: [],
  USER_CREATE: [],
  USER_UPDATE: [],
  USER_SOFT_DELETE: [],
  USER_ASSIGN_ROLE: ['USER_LIST', 'ROLE_LIST'], // Rol atamak için kullanıcı ve rol listesi gerekir

  // Rol & Yetki Yönetimi
  ROLE_LIST: [],
  ROLE_VIEW: [],
  ROLE_CREATE: [],
  ROLE_UPDATE: [],
  ROLE_DELETE: [],
  ROLE_MANAGE_PERMISSIONS: ['ROLE_VIEW'], // İzin yönetmek için rol detayı gerekir

  // Üye Yönetimi
  MEMBER_LIST: [],
  MEMBER_VIEW: [],
  MEMBER_CREATE_APPLICATION: [
    'INSTITUTION_LIST', // Kurum seçimi için
    'REGION_LIST', // İl/İlçe seçimi için
  ],
  MEMBER_APPROVE: ['MEMBER_VIEW'], // Onaylamak için üye detayı gerekir
  MEMBER_REJECT: ['MEMBER_VIEW'], // Reddetmek için üye detayı gerekir
  MEMBER_UPDATE: [
    'INSTITUTION_LIST', // Kurum güncellemesi için
    'REGION_LIST', // İl/İlçe güncellemesi için
    'MEMBER_VIEW', // Güncellemek için üye detayı gerekir
  ],
  MEMBER_STATUS_CHANGE: ['MEMBER_VIEW'], // Durum değiştirmek için üye detayı gerekir
  MEMBER_LIST_BY_PROVINCE: [],

  // Aidat Yönetimi
  DUES_PLAN_MANAGE: [],
  DUES_PAYMENT_ADD: ['MEMBER_VIEW'], // Ödeme eklemek için üye bilgisi gerekir
  DUES_REPORT_VIEW: [],
  DUES_DEBT_LIST_VIEW: ['MEMBER_LIST'], // Borçlu listesi için üye listesi gerekir
  DUES_EXPORT: ['DUES_REPORT_VIEW'], // Dışa aktarmak için rapor görüntüleme gerekir

  // Şube / İl / İlçe Yönetimi
  REGION_LIST: [],
  BRANCH_MANAGE: ['REGION_LIST'], // Şube yönetmek için bölge listesi gerekir
  BRANCH_ASSIGN_PRESIDENT: ['BRANCH_MANAGE', 'USER_LIST'], // Başkan atamak için şube yönetimi ve kullanıcı listesi gerekir

  // İçerik Yönetimi
  CONTENT_MANAGE: [],
  CONTENT_PUBLISH: ['CONTENT_MANAGE'], // Yayınlamak için içerik yönetimi gerekir

  // Evrak & Doküman
  DOCUMENT_TEMPLATE_MANAGE: [],
  DOCUMENT_MEMBER_HISTORY_VIEW: ['MEMBER_VIEW'], // Doküman geçmişi için üye detayı gerekir
  DOCUMENT_GENERATE_PDF: ['MEMBER_VIEW'], // PDF oluşturmak için üye detayı gerekir

  // Raporlar & Dashboard
  REPORT_GLOBAL_VIEW: [],
  REPORT_REGION_VIEW: ['REGION_LIST'], // Bölge raporu için bölge listesi gerekir
  REPORT_MEMBER_STATUS_VIEW: ['MEMBER_LIST'], // Üye durum raporu için üye listesi gerekir
  REPORT_DUES_VIEW: ['DUES_REPORT_VIEW'], // Aidat raporu için aidat rapor görüntüleme gerekir

  // Bildirim & İletişim
  NOTIFY_ALL_MEMBERS: ['MEMBER_LIST'], // Tüm üyelere bildirim için üye listesi gerekir
  NOTIFY_REGION: ['REGION_LIST'], // Bölgeye bildirim için bölge listesi gerekir
  NOTIFY_OWN_SCOPE: [],

  // Sistem Ayarları & Loglar
  SYSTEM_SETTINGS_VIEW: [],
  SYSTEM_SETTINGS_MANAGE: ['SYSTEM_SETTINGS_VIEW'], // Yönetmek için görüntüleme gerekir
  LOG_VIEW_ALL: [],
  LOG_VIEW_OWN_SCOPE: [],

  // Kurumlar (Institutions) - Frontend'de eksik, ekleyeceğiz
  INSTITUTION_LIST: [],
  INSTITUTION_VIEW: [],
  INSTITUTION_CREATE: ['REGION_LIST'], // Kurum oluşturmak için bölge listesi gerekir
  INSTITUTION_UPDATE: ['INSTITUTION_VIEW'], // Güncellemek için görüntüleme gerekir
  INSTITUTION_APPROVE: ['INSTITUTION_VIEW'], // Onaylamak için görüntüleme gerekir

  // Muhasebe - Frontend'de eksik, ekleyeceğiz
  ACCOUNTING_VIEW: [],
  ACCOUNTING_EXPORT: ['ACCOUNTING_VIEW'],
  TEVKIFAT_FILE_UPLOAD: [],
  TEVKIFAT_FILE_APPROVE: ['TEVKIFAT_FILE_UPLOAD'],

  // Üye Ödemeleri - Frontend'de eksik, ekleyeceğiz
  MEMBER_PAYMENT_ADD: ['MEMBER_VIEW'],
  MEMBER_PAYMENT_APPROVE: ['MEMBER_PAYMENT_VIEW'],
  MEMBER_PAYMENT_LIST: ['MEMBER_LIST'],
  MEMBER_PAYMENT_VIEW: ['MEMBER_VIEW'],

  // Onay Süreçleri - Frontend'de eksik, ekleyeceğiz
  APPROVAL_VIEW: [],
  APPROVAL_APPROVE: ['APPROVAL_VIEW'],
  APPROVAL_REJECT: ['APPROVAL_VIEW'],
};

/**
 * Bir iznin tüm bağımlılıklarını (recursive) döndürür
 */
export function getAllDependencies(permission: Permission): Permission[] {
  const directDeps = PERMISSION_DEPENDENCIES[permission] || [];
  const allDeps = new Set<Permission>(directDeps);

  // Recursive olarak tüm bağımlılıkları topla
  directDeps.forEach((dep) => {
    const subDeps = getAllDependencies(dep);
    subDeps.forEach((subDep) => allDeps.add(subDep));
  });

  return Array.from(allDeps);
}

/**
 * Birden fazla iznin tüm bağımlılıklarını döndürür
 */
export function getDependenciesForPermissions(permissions: Permission[]): Permission[] {
  const allDeps = new Set<Permission>();

  permissions.forEach((permission) => {
    const deps = getAllDependencies(permission);
    deps.forEach((dep) => allDeps.add(dep));
  });

  return Array.from(allDeps);
}

/**
 * Bir iznin hangi izinler tarafından gerektirildiğini bulur (reverse lookup)
 */
export function getRequiredBy(permission: Permission): Permission[] {
  const requiredBy: Permission[] = [];

  Object.entries(PERMISSION_DEPENDENCIES).forEach(([perm, deps]) => {
    if (deps.includes(permission)) {
      requiredBy.push(perm as Permission);
    }
  });

  return requiredBy;
}

/**
 * Eksik bağımlılıkları kontrol eder ve döndürür
 */
export function getMissingDependencies(
  selectedPermissions: Permission[],
  allAvailablePermissions: Permission[],
): Permission[] {
  const requiredDeps = getDependenciesForPermissions(selectedPermissions);
  const missing = requiredDeps.filter(
    (dep) => !selectedPermissions.includes(dep) && allAvailablePermissions.includes(dep),
  );

  return missing;
}

