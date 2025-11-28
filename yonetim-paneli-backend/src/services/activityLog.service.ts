import prisma from "../config/prisma";

interface LogParams {
  userId?: number;
  action: string;
  entity?: string;
  entityId?: number;
  details?: string;
}

export async function logActivity(params: LogParams) {
  try {
    const { userId, action, entity, entityId, details } = params;

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (err) {
    // Log yazılırken hata alırsak, ana işlemi bozmayalım, sadece konsola yazalım
    console.error("Activity log error:", err);
  }
}
