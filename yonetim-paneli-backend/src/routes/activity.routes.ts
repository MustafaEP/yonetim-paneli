import { Router } from "express";
import { getActivityLogs } from "../controllers/activity.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

// Sadece ACTIVITY_READ izni olanlar (bizde pratikte sadece ADMIN)
router.get(
  "/",
  authMiddleware,
  checkPermission("ACTIVITY_READ"),
  getActivityLogs
);

export default router;
