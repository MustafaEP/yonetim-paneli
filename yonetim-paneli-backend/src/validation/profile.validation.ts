import { z } from "zod";

export const updateProfileValidation = {
  body: z.object({
    name: z
      .string()
      .min(2, "İsim en az 2 karakter olmalı")
      .max(100, "İsim en fazla 100 karakter olabilir"),
  }),
};

export const changePasswordValidation = {
  body: z.object({
    currentPassword: z
      .string()
      .min(1, "Mevcut şifre zorunludur"),
    newPassword: z
      .string()
      .min(6, "Yeni şifre en az 6 karakter olmalı")
      .max(100, "Yeni şifre en fazla 100 karakter olabilir"),
  }),
};
