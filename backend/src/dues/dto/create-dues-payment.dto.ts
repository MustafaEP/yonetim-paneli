export class CreateDuesPaymentDto {
  memberId: string;
  planId?: string;
  amount: number;
  periodYear?: number;   // örn: 2025
  periodMonth?: number;  // 1-12
  note?: string;
}
