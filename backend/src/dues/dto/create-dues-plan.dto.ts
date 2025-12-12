import { ApiProperty } from '@nestjs/swagger';
import { DuesPeriod } from '@prisma/client';

export class CreateDuesPlanDto {
  @ApiProperty({
    description: 'Aidat planı adı',
    example: 'Aylık Aidat 2025',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Aidat planı açıklaması',
    example: '2025 yılı için aylık aidat planı',
    type: String,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Aidat tutarı (TL)',
    example: 100.50,
    type: Number,
    minimum: 0,
  })
  amount: number;

  @ApiProperty({
    description: 'Aidat dönemi',
    example: DuesPeriod.MONTHLY,
    enum: DuesPeriod,
  })
  period: DuesPeriod;
}
