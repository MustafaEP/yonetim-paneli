import type { PermissionCode } from "./permissions";
import type { UserRole } from "../../prisma/generated/client";

export interface RoleDefinition {
  name: UserRole;
  permissions: PermissionCode[];
}

const allPermissions: PermissionCode[] = [
  "USER_READ",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "PRODUCT_READ",
  "PRODUCT_CREATE",
  "PRODUCT_UPDATE",
  "PRODUCT_DELETE",
];

export const roleDefinitions: RoleDefinition[] = [
  {
    name: "ADMIN",
    permissions: allPermissions,
  },
  {
    name: "MANAGER",
    permissions: [
      "USER_READ",
      "PRODUCT_READ",
      "PRODUCT_CREATE",
      "PRODUCT_UPDATE",
    ],
  },
  {
    name: "EDITOR",
    permissions: ["PRODUCT_READ", "PRODUCT_CREATE", "PRODUCT_UPDATE"],
  },
  {
    name: "VIEWER",
    permissions: ["PRODUCT_READ"],
  },
];

export const getPermissionsForRole = (role: UserRole): PermissionCode[] => {
  const def = roleDefinitions.find((r) => r.name === role);
  return def ? def.permissions : [];
};
