import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { users, getNextUserId, User, validRoles } from "../data/users";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email ve password zorunlu." });
    }

    const existing = users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "Bu email ile kayıtlı bir kullanıcı zaten var." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Geçerli rol mü?
    let selectedRole: User["role"] = "VIEWER";
    if (role && validRoles.includes(role)) {
      selectedRole = role;
    }

    const newUser: User = {
      id: getNextUserId(),
      name,
      email,
      passwordHash,
      role: selectedRole,
      isActive: true,
    };

    users.push(newUser);

    return res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email ve password zorunlu." });
    }

    const user = users.find((u) => u.email === email);
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

export const me = (req: Request, res: Response) => {
  // Bu route'a erişmek için auth middleware kullanacağız
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: "Yetkisiz." });
  }

  return res.json({ user });
};
