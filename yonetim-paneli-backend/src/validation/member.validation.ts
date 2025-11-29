import { z } from "zod";

const registrationDateSchema = z
  .string({
    required_error: "Üye kayıt tarihi zorunludur",
  })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Geçerli bir tarih giriniz",
  })
  .refine((value) => {
    const dateValue = new Date(value);
    const today = new Date();
    dateValue.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dateValue <= today;
  }, {
    message: "Kayıt tarihi gelecekte olamaz",
  });

export const createMemberValidation = {
  body: z.object({
    status: z.enum(["BEKLEME", "AKTİF", "İSTİFA"], {
      required_error: "Üyelik durumu zorunludur",
    }),

    // Üye Kayıt No - zorunlu, 10 haneli, sadece rakam
    registrationNo: z
      .string({
        required_error: "Üye kayıt numarası zorunludur",
      })
      .trim()
      .regex(/^\d{10}$/, "Üye kayıt numarası 10 haneli ve sadece rakam olmalıdır"),

    // TC - zorunlu, 11 haneli, sadece rakam
    nationalId: z
      .string({
        required_error: "TC kimlik numarası zorunludur",
      })
      .trim()
      .regex(/^\d{11}$/, "TC kimlik numarası 11 haneli ve sadece rakam olmalıdır"),

    // Kimlik Bilgileri - zorunlu
    firstName: z
      .string({
        required_error: "Ad zorunludur",
      })
      .trim()
      .min(2, "Ad en az 2 karakter olmalı"),

    lastName: z
      .string({
        required_error: "Soyad zorunludur",
      })
      .trim()
      .min(2, "Soyad en az 2 karakter olmalı"),

    motherName: z
      .string({
        required_error: "Anne adı zorunludur",
      })
      .trim()
      .min(2, "Anne adı en az 2 karakter olmalı"),

    fatherName: z
      .string({
        required_error: "Baba adı zorunludur",
      })
      .trim()
      .min(2, "Baba adı en az 2 karakter olmalı"),

    birthPlace: z
      .string({
        required_error: "Doğum yeri zorunludur",
      })
      .trim()
      .min(2, "Doğum yeri en az 2 karakter olmalı"),

    // Çalışma Bilgileri - zorunlu
    province: z
      .string({
        required_error: "İl zorunludur",
      })
      .trim()
      .min(1, "İl zorunludur"),

    district: z
      .string({
        required_error: "İlçe zorunludur",
      })
      .trim()
      .min(1, "İlçe zorunludur"),

    institution: z
      .string({
        required_error: "Çalıştığı kurum zorunludur",
      })
      .trim()
      .min(4, "Çalıştığı kurum en az 4 karakter olmalıdır")
      .max(25, "Çalıştığı kurum en fazla 25 karakter olabilir"),

    // Diğer Bilgiler - zorunlu
    gender: z.enum(["ERKEK", "KADIN"], {
      required_error: "Cinsiyet zorunludur",
    }),

    educationStatus: z.enum(["İLKÖĞRETİM", "LİSE", "YÜKSEKOKUL"], {
      required_error: "Öğrenim durumu zorunludur",
    }),

    phoneNumber: z
      .string({
        required_error: "Telefon zorunludur",
      })
      .trim()
      .refine((value) => value.replace(/\D/g, "").length >= 10, {
        message: "Telefon numarası en az 10 rakam içermelidir",
      }),

    registrationDate: registrationDateSchema,

    ledgerNo: z
      .string({
        required_error: "Kara defter numarası zorunludur",
      })
      .trim()
      .regex(/^\d{10}$/, "Kara defter numarası 10 haneli ve sadece rakam olmalıdır"),
  }),
};

// Update'de de aynı kuralları uyguluyoruz (PUT mantığı)
export const updateMemberValidation = {
  body: createMemberValidation.body,
};
