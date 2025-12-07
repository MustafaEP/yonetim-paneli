import { DuesPeriod } from '@prisma/client';

export class UpdateDuesPlanDto {
  name?: string;
  description?: string;
  amount?: number;
  period?: DuesPeriod;
  isActive?: boolean;
}
