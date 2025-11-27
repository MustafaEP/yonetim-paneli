export type UserRole = "ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";

export const validRoles: UserRole[] = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export const users: User[] = [];

let currentId = 1;
export const getNextUserId = () => currentId++;
