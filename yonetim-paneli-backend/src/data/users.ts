export type UserRole = "ADMIN" | "USER";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

// Geçici veri
export const users: User[] = [];

// ID üretmek için basit sayaç
let currentId = 1;
export const getNextUserId = () => currentId++;
