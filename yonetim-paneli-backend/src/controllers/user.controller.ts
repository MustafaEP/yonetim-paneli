import { Request, Response } from "express";
import prisma from "../config/prisma";
import type { UserRole } from "@prisma/client";
import { logActivity } from "../services/activityLog.service";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // ?page=1&limit=10&search=ali&role=EDITOR&status=active
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string | undefined) || "";
    const role = req.query.role as UserRole | undefined;
    const status = req.query.status as "active" | "inactive" | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
          },
        },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: {
          id: "asc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      page,
      limit,
      total,
      users,
    });
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

    await logActivity({
      userId: req.user?.id,
      action: "USER_ROLE_UPDATE",
      entity: "User",
      entityId: updated.id,
      details: `Kullanıcının rolü ${updated.role} olarak güncellendi (${updated.email})`,
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

