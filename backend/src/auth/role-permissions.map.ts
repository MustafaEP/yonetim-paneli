import { Role } from '@prisma/client';
import { Permission } from './permission.enum';

const ALL_PERMISSIONS = Object.values(Permission);

// Bazı grupları toplayalım
const MEMBER_PERMISSIONS = [
  Permission.MEMBER_LIST,
  Permission.MEMBER_VIEW,
  Permission.MEMBER_CREATE_APPLICATION,
  Permission.MEMBER_APPROVE,
  Permission.MEMBER_REJECT,
  Permission.MEMBER_UPDATE,
  Permission.MEMBER_STATUS_CHANGE,
];

const DUES_PERMISSIONS = [
  Permission.DUES_PLAN_MANAGE,
  Permission.DUES_PAYMENT_ADD,
  Permission.DUES_REPORT_VIEW,
  Permission.DUES_DEBT_LIST_VIEW,
  Permission.DUES_EXPORT,
];

const CONTENT_PERMISSIONS = [
  Permission.CONTENT_MANAGE,
  Permission.CONTENT_PUBLISH,
];

const REPORT_PERMISSIONS = [
  Permission.REPORT_GLOBAL_VIEW,
  Permission.REPORT_REGION_VIEW,
  Permission.REPORT_MEMBER_STATUS_VIEW,
  Permission.REPORT_DUES_VIEW,
];

const NOTIFY_PERMISSIONS = [
  Permission.NOTIFY_ALL_MEMBERS,
  Permission.NOTIFY_REGION,
  Permission.NOTIFY_OWN_SCOPE,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // 1) ADMIN: her şeye erişim
  [Role.ADMIN]: ALL_PERMISSIONS,

  // 2) MODERATOR
  [Role.MODERATOR]: [
    // Kullanıcı Yönetimi
    Permission.USER_LIST,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_SOFT_DELETE,
    Permission.USER_ASSIGN_ROLE,

    // Rol & Yetki -> sadece listele/gör
    Permission.ROLE_LIST,
    Permission.ROLE_VIEW,

    // Üye Yönetimi
    ...MEMBER_PERMISSIONS,

    // Aidat
    ...DUES_PERMISSIONS,

    // Bölge / Şube / İl / İlçe / İş Yeri / Bayi
    Permission.REGION_LIST,
    Permission.BRANCH_MANAGE,
    Permission.BRANCH_ASSIGN_PRESIDENT,
    Permission.WORKPLACE_LIST,
    Permission.WORKPLACE_MANAGE,
    Permission.WORKPLACE_ASSIGN_REP,
    Permission.WORKPLACE_MEMBERS_VIEW,
    Permission.DEALER_LIST,
    Permission.DEALER_CREATE,
    Permission.DEALER_APPROVE_APPLICATION,
    Permission.DEALER_UPDATE,
    Permission.DEALER_PERFORMANCE_VIEW,

    // İçerik, Rapor, Bildirim
    ...CONTENT_PERMISSIONS,
    ...REPORT_PERMISSIONS,
    ...NOTIFY_PERMISSIONS,

    // Sistem Ayarları & Loglar
    Permission.SYSTEM_SETTINGS_VIEW,
    Permission.LOG_VIEW_ALL,
  ],

  // 3) GENEL_BASKAN
  [Role.GENEL_BASKAN]: [
    // Kullanıcı / Rol yönetimi: sadece okuma
    Permission.USER_LIST,
    Permission.USER_VIEW,
    Permission.ROLE_LIST,
    Permission.ROLE_VIEW,

    // Üye Yönetimi: ülke çapı
    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_APPROVE,
    Permission.MEMBER_REJECT,
    Permission.MEMBER_STATUS_CHANGE,
    Permission.MEMBER_UPDATE,

    // Aidat raporları
    Permission.DUES_REPORT_VIEW,
    Permission.DUES_DEBT_LIST_VIEW,

    // Bölgesel yapı
    Permission.REGION_LIST,
    Permission.BRANCH_MANAGE,
    Permission.BRANCH_ASSIGN_PRESIDENT,

    // Bayi üst onay
    Permission.DEALER_LIST,
    Permission.DEALER_APPROVE_APPLICATION,
    Permission.DEALER_PERFORMANCE_VIEW,

    // İçerik, Rapor, Bildirim
    ...CONTENT_PERMISSIONS,
    ...REPORT_PERMISSIONS,
    Permission.NOTIFY_ALL_MEMBERS,
    Permission.NOTIFY_REGION,

    // Loglar
    Permission.LOG_VIEW_ALL,
  ],

  // 4) GENEL_BASKAN_YRD
  [Role.GENEL_BASKAN_YRD]: [
    // Okuma yetkisi geniş
    Permission.USER_LIST,
    Permission.USER_VIEW,
    Permission.ROLE_LIST,
    Permission.ROLE_VIEW,

    // Üyelik akışı
    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_APPROVE,
    Permission.MEMBER_REJECT,
    Permission.MEMBER_UPDATE,

    // Aidat raporları (plan değiştirme opsiyonel → şimdilik yok)
    Permission.DUES_REPORT_VIEW,
    Permission.DUES_DEBT_LIST_VIEW,

    // Bölge yapısı
    Permission.REGION_LIST,

    // İçerik
    ...CONTENT_PERMISSIONS,

    // Raporlar
    ...REPORT_PERMISSIONS,

    // Bildirim
    Permission.NOTIFY_REGION,
  ],

  // 5) GENEL_SEKRETER
  [Role.GENEL_SEKRETER]: [
    // Üyeleri ve temsilcileri görmek
    Permission.USER_LIST,
    Permission.USER_VIEW,
    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,

    // Evrak / Doküman
    Permission.DOCUMENT_TEMPLATE_MANAGE,
    Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
    Permission.DOCUMENT_GENERATE_PDF,

    // İçerik taslak / duyuru
    Permission.CONTENT_MANAGE,

    // Rapor
    Permission.REPORT_GLOBAL_VIEW,
    Permission.REPORT_MEMBER_STATUS_VIEW,
  ],

  // 6) IL_BASKANI
  [Role.IL_BASKANI]: [
    // Kendi ilindeki üyeler, ilçeler vs. (scope service tarafında)
    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE_APPLICATION,
    Permission.MEMBER_APPROVE,
    Permission.MEMBER_REJECT,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_STATUS_CHANGE,

    Permission.REGION_LIST,
    Permission.BRANCH_MANAGE,
    Permission.WORKPLACE_LIST,
    Permission.WORKPLACE_ASSIGN_REP,
    Permission.WORKPLACE_MEMBERS_VIEW,

    // Aidat (kendi ili için)
    Permission.DUES_REPORT_VIEW,
    Permission.DUES_DEBT_LIST_VIEW,

    // İçerik ve Bildirim (il bazlı)
    Permission.CONTENT_MANAGE,
    Permission.CONTENT_PUBLISH,
    Permission.NOTIFY_REGION,
    Permission.NOTIFY_OWN_SCOPE,

    // Rapor
    Permission.REPORT_REGION_VIEW,
    Permission.REPORT_MEMBER_STATUS_VIEW,
    Permission.REPORT_DUES_VIEW,
  ],

  // 7) ILCE_TEMSILCISI
  [Role.ILCE_TEMSILCISI]: [
    // Kendi ilçesi
    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE_APPLICATION,
    Permission.MEMBER_UPDATE,

    Permission.WORKPLACE_LIST,
    Permission.WORKPLACE_MEMBERS_VIEW,

    // Rapor (ilçe bazlı)
    Permission.REPORT_REGION_VIEW,
    Permission.REPORT_MEMBER_STATUS_VIEW,

    // Bildirim
    Permission.NOTIFY_OWN_SCOPE,
  ],

  // 8) ISYERI_TEMSILCISI
  [Role.ISYERI_TEMSILCISI]: [
    // Kendi iş yeri
    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE_APPLICATION,
    Permission.MEMBER_STATUS_CHANGE, // talep yaratma gibi düşünülebilir
    Permission.WORKPLACE_MEMBERS_VIEW,

    // Aidat durumu görüntüleme
    Permission.DUES_REPORT_VIEW,

    // Rapor
    Permission.REPORT_MEMBER_STATUS_VIEW,

    // Bildirim
    Permission.NOTIFY_OWN_SCOPE,
  ],

  // 9) BAYI_YETKILISI
  [Role.BAYI_YETKILISI]: [
    // Kendi bayisi
    Permission.DEALER_LIST,
    Permission.DEALER_UPDATE,
    Permission.DEALER_PERFORMANCE_VIEW,

    Permission.MEMBER_LIST,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE_APPLICATION,
    Permission.MEMBER_UPDATE,

    Permission.DUES_REPORT_VIEW,

    Permission.REPORT_REGION_VIEW,
    Permission.REPORT_MEMBER_STATUS_VIEW,

    Permission.NOTIFY_OWN_SCOPE,
  ],

  // 10) UYE
  [Role.UYE]: [
    // Kendi profil/aidat/evrak işleri (bunları daha sonra endpoint bazlı daraltacağız)
    Permission.MEMBER_VIEW,
    Permission.DUES_REPORT_VIEW,
    Permission.DOCUMENT_MEMBER_HISTORY_VIEW,
  ],
};

// Kullanıcı rollerinden effective permission set üretmek için helper:
export const getPermissionsForRoles = (roles: Role[]): Permission[] => {
  const set = new Set<Permission>();

  // ADMIN ise direkt tüm yetkileri ver
  if (roles.includes(Role.ADMIN)) {
    return ALL_PERMISSIONS;
  }

  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role] || [];
    perms.forEach((p) => set.add(p));
  }

  return Array.from(set);
};
