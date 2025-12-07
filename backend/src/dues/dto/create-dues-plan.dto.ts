import { DuesPeriod } from '@prisma/client';

export class CreateDuesPlanDto {
  name: string;
  description?: string;
  amount: number;         // TL değer, backend'de Decimal'e çevireceğiz
  period: DuesPeriod;     // 'MONTHLY' | 'YEARLY'
}
