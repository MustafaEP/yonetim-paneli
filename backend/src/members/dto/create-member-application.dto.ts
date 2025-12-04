import { MemberSource } from '@prisma/client';

export class CreateMemberApplicationDto {
  firstName: string;
  lastName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  source?: MemberSource; // opsiyonel, default DIRECT
}
