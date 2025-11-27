export type PermissionCode =
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "PRODUCT_READ"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE";

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
];
