import { Request, Response } from "express";
import { users, validRoles, UserRole } from "../data/users";

export const getAllUsers = (_req: Request, res: Response) => {
  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
  }));

  return res.json({ users: safeUsers });
};

export const updateUserRole = (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { role } = req.body as { role: UserRole };

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ message: "Geçerli bir rol gönderin." });
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  user.role = role;

  return res.json({
    message: "Kullanıcı rolü güncellendi.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
};
