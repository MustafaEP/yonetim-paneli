import { Role } from '@prisma/client';

export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: Role[]; // Admin/moderator seed veya panelden atanacak
}
