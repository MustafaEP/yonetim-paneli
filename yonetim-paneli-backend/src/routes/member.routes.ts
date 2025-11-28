import { Router } from "express";
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/member.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { validate } from "../middlewares/validate";
import {
  createMemberValidation,
  updateMemberValidation,
} from "../validation/member.validation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  checkPermission("MEMBER_READ"),
  getAllMembers
);

router.get(
  "/:id",
  authMiddleware,
  checkPermission("MEMBER_READ"),
  getMemberById
);

router.post(
  "/",
  authMiddleware,
  checkPermission("MEMBER_CREATE"),
  validate(createMemberValidation),
  createMember
);

router.put(
  "/:id",
  authMiddleware,
  checkPermission("MEMBER_UPDATE"),
  validate(updateMemberValidation),
  updateMember
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission("MEMBER_DELETE"),
  deleteMember
);

export default router;
