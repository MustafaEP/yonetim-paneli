export type UserRole = "ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
