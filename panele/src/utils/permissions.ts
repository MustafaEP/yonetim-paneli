// src/utils/permissions.ts
import type { BackendUser } from '../types/auth';
import type { Role } from '../types/user';

const highLevelRoles: Role[] = [
  'ADMIN',
  'GENEL_BASKAN',
  'GENEL_BASKAN_YRD',
  'GENEL_SEKRETER',
];

export const hasRole = (user: BackendUser | null, role: Role): boolean => {
  if (!user) return false;
  return user.roles?.includes(role);
};

export const hasAnyRole = (
  user: BackendUser | null,
  roles: Role[],
): boolean => {
  if (!user) return false;
  return user.roles?.some((r) => roles.includes(r)) ?? false;
};

export const hasPermission = (
  user: BackendUser | null,
  permission: string,
): boolean => {
  if (!user) return false;
  // Admin her şeye erişsin
  if (user.roles?.includes('ADMIN')) return true;
  return user.permissions?.includes(permission) ?? false;
};

// 🔍 Üye detayında hassas alanları görebilecek roller
export const canViewSensitiveMemberFields = (
  user: BackendUser | null,
): boolean => {
  // Örn: TC Kimlik, telefon, e-posta
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;

  // İstersen burada özel bir permission da kontrol edebilirsin
  return hasPermission(user, 'MEMBER_VIEW');
};

// 💰 Üye ödeme detaylarını görebilecek roller
export const canViewMemberPayments = (
  user: BackendUser | null,
): boolean => {
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;
  return hasPermission(user, 'DUES_REPORT_VIEW');
};

// 🧾 Aidat planlarını yönetebilecek roller
export const canManageDuesPlans = (user: BackendUser | null): boolean => {
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;
  return hasPermission(user, 'DUES_PLAN_MANAGE');
};

// ✅ Üye onaylama yetkisi
export const canApproveMember = (user: BackendUser | null): boolean => {
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;
  return hasPermission(user, 'MEMBER_APPROVE');
};

// ❌ Üye başvurusu reddetme yetkisi
export const canRejectMember = (user: BackendUser | null): boolean => {
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;
  return hasPermission(user, 'MEMBER_REJECT');
};

// 🗑 Üyeyi soft delete etme / statü değiştirme yetkisi
export const canSoftDeleteMember = (user: BackendUser | null): boolean => {
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;
  return hasPermission(user, 'MEMBER_STATUS_CHANGE');
};

// Şube Yönetimi Helper’ı
export const canManageBranches = (user: BackendUser | null): boolean => {
  if (!user) return false;
  if (hasAnyRole(user, highLevelRoles)) return true;
  return hasPermission(user, 'BRANCH_MANAGE');
};