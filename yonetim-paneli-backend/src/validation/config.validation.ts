import { z } from "zod";

export const updateConfigValidation = {
  body: z.record(z.string().min(1)),
};
