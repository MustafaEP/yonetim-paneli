import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    // basit pagination: ?page=1&limit=20
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.activityLog.count(),
    ]);

    return res.json({
      page,
      limit,
      total,
      logs,
    });
  } catch (err) {
    console.error("getActivityLogs error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};
