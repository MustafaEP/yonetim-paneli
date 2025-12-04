// Permission enum – backend ile birebir aynı olmalı
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


// Kullanıcı izin kontrolü için helper
export const hasPermission = (
  userPermissions: Permission[] | undefined,
  permission: Permission,
): boolean => {
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
};


// Menü item tipi
export interface MenuItem {
  label: string;
  path: string;
  requiredPermissions?: Permission[];
  children?: MenuItem[];
}


// Menü tanımı
export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Kullanıcılar',
    path: '/users',
    requiredPermissions: ['USER_LIST'],
  },
  {
    label: 'Üyeler',
    path: '/members',
    requiredPermissions: ['MEMBER_LIST'],
  },
  {
    label: 'Aidat & Mali İşler',
    path: '/finance',
    requiredPermissions: ['DUES_REPORT_VIEW'],
  },
  {
    label: 'Raporlar',
    path: '/reports',
    requiredPermissions: ['REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW'],
  },
  {
    label: 'Sistem Ayarları',
    path: '/settings',
    requiredPermissions: ['SYSTEM_SETTINGS_VIEW'],
  },
];


export const filterMenuByPermissions = (
  items: MenuItem[],
  userPermissions: Permission[],
): MenuItem[] => {
  return items
    .map<MenuItem | null>((item) => {
      const children = item.children
        ? filterMenuByPermissions(item.children, userPermissions)
        : undefined;

      const required = item.requiredPermissions;
      const allowed =
        !required ||
        required.some((p) => userPermissions.includes(p));

      // Bu item tamamen gizlenecekse:
      if (!allowed && (!children || children.length === 0)) {
        return null;
      }

      // Yeni MenuItem oluştur
      const newItem: MenuItem = {
        label: item.label,
        path: item.path,
        requiredPermissions: item.requiredPermissions,
        // children varsa ekle, yoksa hiç koyma (opsiyonel kalsın)
        ...(children && children.length > 0 ? { children } : {}),
      };

      return newItem;
    })
    .filter((x): x is MenuItem => x !== null);
};
