export type PermissionCode =
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "PRODUCT_READ"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "ACTIVITY_READ"
  | "SYSTEM_CONFIG_READ"
  | "SYSTEM_CONFIG_UPDATE"
  | "MEMBER_READ"
  | "MEMBER_CREATE"
  | "MEMBER_UPDATE"
  | "MEMBER_DELETE"
;

export interface Permission {
  code: PermissionCode;
  description: string;
}

export const permissions: Permission[] = [
  { code: "USER_READ", description: "Kullanıcıları görüntüleme" },
  { code: "USER_CREATE", description: "Yeni kullanıcı oluşturma" },
  { code: "USER_UPDATE", description: "Kullanıcı güncelleme" },
  { code: "USER_DELETE", description: "Kullanıcı silme" },
  { code: "PRODUCT_READ", description: "Ürünleri görüntüleme" },
  { code: "PRODUCT_CREATE", description: "Yeni ürün ekleme" },
  { code: "PRODUCT_UPDATE", description: "Ürün güncelleme" },
  { code: "PRODUCT_DELETE", description: "Ürün silme" },
  { code: "ACTIVITY_READ", description: "Aktivite loglarını görüntüleme" },
  { code: "SYSTEM_CONFIG_READ", description: "Sistem ayarlarını okuma" },
  { code: "SYSTEM_CONFIG_UPDATE", description: "Sistem ayarlarını güncelleme" },
  { code: "MEMBER_READ", description: "Üye listeleme" },
  { code: "MEMBER_CREATE", description: "Üye ekleme" },
  { code: "MEMBER_UPDATE", description: "Üye güncelleme" },
  { code: "MEMBER_DELETE", description: "Üye silme" },

];
