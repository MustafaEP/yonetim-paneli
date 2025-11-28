import { Router } from "express";
import { getSystemConfig, updateSystemConfig } from "../controllers/config.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { validate } from "../middlewares/validate";
import { updateConfigValidation } from "../validation/config.validation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  checkPermission("SYSTEM_CONFIG_READ"),
  getSystemConfig
);

router.patch(
  "/",
  authMiddleware,
  checkPermission("SYSTEM_CONFIG_UPDATE"),
  validate(updateConfigValidation),
  updateSystemConfig
);

export default router;
