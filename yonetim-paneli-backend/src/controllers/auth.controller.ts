import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { logActivity } from "../services/activityLog.service";
import type { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
    };

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email ve password zorunlu." });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Bu email ile kayıtlı bir kullanıcı zaten var." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Geçerli rol mü?
    const validRoles: UserRole[] = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];
    let selectedRole: UserRole = "VIEWER";

    if (role && validRoles.includes(role)) {
      selectedRole = role;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: selectedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user: newUser,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email ve password zorunlu." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Geçersiz email veya şifre." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Geçersiz email veya şifre." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Hesap pasif durumda." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Giriş başarılı.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const me = async (req: Request, res: Response) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ message: "Yetkisiz." });
  }

  // İstersen DB'den de çekebilirsin ama şimdilik token'dan geleni döndürmek yeterli
  return res.json({ user: authUser });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ message: "Yetkisiz." });
    }

    const { name } = req.body as { name: string };

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await logActivity({
      userId: authUser.id,
      action: "PROFILE_UPDATE",
      entity: "User",
      entityId: updated.id,
      details: `Kullanıcı kendi profil adını güncelledi (${updated.email})`,
    });

    return res.json({
      message: "Profil güncellendi.",
      user: updated,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ message: "Yetkisiz." });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ message: "Mevcut şifre hatalı." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    await logActivity({
      userId: authUser.id,
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: user.id,
      details: `Kullanıcı şifresini güncelledi (${user.email})`,
    });

    return res.json({
      message: "Şifre başarıyla güncellendi.",
    });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};
