import { z } from "zod";

export const createMemberValidation = {
  body: z.object({
    status: z.enum(["BEKLEME", "AKTİF", "İSTİFA"]),
    registrationNo: z.string().optional(),
    nationalId: z
      .string()
      .length(11, "TC kimlik numarası 11 haneli olmalı")
      .optional(),
    firstName: z.string().min(2, "Ad en az 2 karakter olmalı"),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalı"),
    province: z.string().optional(),
    district: z.string().optional(),
    institution: z.string().optional(),
    motherName: z.string().optional(),
    fatherName: z.string().optional(),
    birthPlace: z.string().optional(),
    gender: z.enum(["ERKEK", "KADIN"]).optional(),
    educationStatus: z
      .enum(["İLKÖĞRETİM", "LİSE", "YÜKSEKOKUL"])
      .optional(),
    phoneNumber: z.string().optional(),
    registrationDate: z.string().optional(), // ISO string
    ledgerNo: z.string().optional(),
  }),
};

export const updateMemberValidation = {
  body: createMemberValidation.body.partial(),
};
