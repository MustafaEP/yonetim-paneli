import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  registerValidation,
  loginValidation,
} from "../validation/auth.validation";
import {
  updateProfileValidation,
  changePasswordValidation,
} from "../validation/profile.validation";
import { updateProfile, changePassword } from "../controllers/auth.controller";


const router = Router();

router.post("/register", validate(registerValidation), register);
router.post("/login", validate(loginValidation), login);
router.get("/me", authMiddleware, me);

// Profil güncelleme
router.patch(
  "/me/profile",
  authMiddleware,
  validate(updateProfileValidation),
  updateProfile
);

// Şifre değiştirme
router.patch(
  "/me/password",
  authMiddleware,
  validate(changePasswordValidation),
  changePassword
);

export default router;
