import { z } from "zod";

const priceSchema = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((val) => !Number.isNaN(val) && val >= 0, {
    message: "Fiyat 0 veya daha büyük bir sayı olmalı",
  });

const stockSchema = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((val) => Number.isInteger(val) && val >= 0, {
    message: "Stok 0 veya daha büyük bir tam sayı olmalı",
  });

export const createProductValidation = {
  body: z.object({
    name: z
      .string()
      .min(2, "Ürün adı en az 2 karakter olmalı")
      .max(200, "Ürün adı en fazla 200 karakter olabilir"),
    price: priceSchema,
    stock: stockSchema,
  }),
};

export const updateProductValidation = {
  body: z
    .object({
      name: z
        .string()
        .min(2, "Ürün adı en az 2 karakter olmalı")
        .max(200, "Ürün adı en fazla 200 karakter olabilir")
        .optional(),
      price: priceSchema.optional(),
      stock: stockSchema.optional(),
    })
    .refine(
      (data) => data.name !== undefined || data.price !== undefined || data.stock !== undefined,
      { message: "En az bir alan (name/price/stock) güncellenmeli" }
    ),
};
