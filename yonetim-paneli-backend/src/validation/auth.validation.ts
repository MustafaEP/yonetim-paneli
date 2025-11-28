import { z } from "zod";

export const registerValidation = {
  body: z.object({
    name: z
      .string()
      .min(2, "İsim en az 2 karakter olmalı")
      .max(100, "İsim en fazla 100 karakter olabilir"),
    email: z.string().email("Geçerli bir email girin"),
    password: z
      .string()
      .min(6, "Şifre en az 6 karakter olmalı")
      .max(100, "Şifre en fazla 100 karakter olabilir"),
    role: z
      .enum(["ADMIN", "MANAGER", "EDITOR", "VIEWER"])
      .optional(),
  }),
};

export const loginValidation = {
  body: z.object({
    email: z.string().email("Geçerli bir email girin"),
    password: z.string().min(1, "Şifre zorunludur"),
  }),
};
