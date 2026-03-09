// src/shared/utils/permissions.ts
import type { BackendUser } from '../../types/auth';

export const hasPermission = (
  user: BackendUser | null,
  permission: string,
): boolean => {
  if (!user) return false;
  return user.permissions?.includes(permission) ?? false;
};

// Üye detayında hassas alanları görebilme
export const canViewSensitiveMemberFields = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'MEMBER_VIEW');
};

// Üye kesinti detaylarını görebilme
export const canViewMemberPayments = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'MEMBER_PAYMENT_VIEW') || hasPermission(user, 'MEMBER_PAYMENT_LIST');
};

// Üye onaylama yetkisi
export const canApproveMember = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'MEMBER_APPROVE');
};

// Üye başvurusu reddetme yetkisi
export const canRejectMember = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'MEMBER_REJECT');
};

// Üyeyi soft delete etme / statü değiştirme yetkisi
export const canSoftDeleteMember = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'MEMBER_STATUS_CHANGE');
};

// Şube Yönetimi
export const canManageBranches = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'BRANCH_MANAGE');
};

// Avans Yönetimi
export const canViewAdvances = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'ADVANCE_VIEW');
};

export const canManageAdvances = (user: BackendUser | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'ADVANCE_ADD');
};
