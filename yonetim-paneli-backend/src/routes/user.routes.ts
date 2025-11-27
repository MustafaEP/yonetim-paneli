import { Router } from "express";
import { getAllUsers, updateUserRole } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

// Tüm kullanıcıları listele (USER_READ gerekli)
router.get(
  "/",
  authMiddleware,
  checkPermission("USER_READ"),
  getAllUsers
);

// Kullanıcının rolünü güncelle (USER_UPDATE gerekli)
router.patch(
  "/:id/role",
  authMiddleware,
  checkPermission("USER_UPDATE"),
  updateUserRole
);

export default router;
