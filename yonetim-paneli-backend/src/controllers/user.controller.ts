import { Request, Response } from "express";
import prisma from "../config/prisma";
import type { UserRole } from "@prisma/client";

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.json({ users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body as { role: UserRole };

    const validRoles: UserRole[] = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Geçerli bir rol gönderin." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return res.json({
      message: "Kullanıcı rolü güncellendi.",
      user: updated,
    });
  } catch (err) {
    console.error("updateUserRole error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};
