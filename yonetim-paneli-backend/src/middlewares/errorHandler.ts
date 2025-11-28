import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Global error handler:", err);

  // AppError ise
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  // Bilinmeyen hata
  return res.status(500).json({
    message: "Beklenmeyen bir hata oluştu.",
  });
};
