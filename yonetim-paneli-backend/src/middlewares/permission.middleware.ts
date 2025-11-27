import { Request, Response, NextFunction } from "express";
import { PermissionCode } from "../data/permissions";
import { getPermissionsForRole } from "../data/roles";

export const checkPermission = (required: PermissionCode) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Yetkisiz." });
    }

    const userRole = req.user.role;
    const permissions = getPermissionsForRole(userRole);

    if (!permissions.includes(required)) {
      return res
        .status(403)
        .json({ message: `Bu işlem için yetkiniz yok (${required}).` });
    }

    next();
  };
};
