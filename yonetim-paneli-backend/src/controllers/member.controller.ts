import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getAllMembers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string | undefined) || "";
    const status = req.query.status as string | undefined; // BEKLEME | AKTİF | İSTİFA
    const province = req.query.province as string | undefined;
    const gender = req.query.gender as string | undefined; // ERKEK | KADIN
    const educationStatus = req.query.educationStatus as string | undefined; // İLKÖĞRETİM | LİSE | YÜKSEKOKUL

    const where: any = {};

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
          },
        },
        {
          lastName: {
            contains: search,
          },
        },
        {
          nationalId: {
            contains: search,
          },
        },
        {
          registrationNo: {
            contains: search,
          },
        },
        {
          institution: {
            contains: search,
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (province) {
      where.province = province;
    }

    if (gender) {
      where.gender = gender;
    }

    if (educationStatus) {
      where.educationStatus = educationStatus;
    }

    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.member.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("getAllMembers error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};


export const getMemberById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const member = await prisma.member.findUnique({ where: { id } });
    return res.json(member);
  } catch (err) {
    console.error("getMemberById error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const createMember = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const member = await prisma.member.create({
      data: {
        ...body,
        registrationDate: body.registrationDate
          ? new Date(body.registrationDate)
          : null,
      },
    });

    return res.status(201).json({
      message: "Üye başarıyla oluşturuldu.",
      member,
    });
  } catch (err) {
    console.error("createMember error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...body,
        registrationDate: body.registrationDate
          ? new Date(body.registrationDate)
          : undefined,
      },
    });

    return res.json({
      message: "Üye başarıyla güncellendi.",
      member,
    });
  } catch (err) {
    console.error("updateMember error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.member.delete({ where: { id } });

    return res.json({ message: "Üye silindi." });
  } catch (err) {
    console.error("deleteMember error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};
