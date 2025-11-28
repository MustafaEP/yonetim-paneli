import { Request, Response } from "express";
import prisma from "../config/prisma";
import { logActivity } from "../services/activityLog.service";

export const getSystemConfig = async (_req: Request, res: Response) => {
  try {
    const all = await prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};

    all.forEach((c) => {
      configMap[c.key] = c.value;
    });

    return res.json(configMap);
  } catch (err) {
    console.error("getSystemConfig error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const updates: Record<string, string> = req.body;

    for (const key in updates) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: updates[key] },
        create: { key, value: updates[key] },
      });
    }

    await logActivity({
      userId: req.user?.id,
      action: "SYSTEM_CONFIG_UPDATE",
      entity: "SystemConfig",
      details: `Sistem ayarları güncellendi`,
    });

    return res.json({
      message: "Ayarlar güncellendi.",
    });
  } catch (err) {
    console.error("updateSystemConfig error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};
