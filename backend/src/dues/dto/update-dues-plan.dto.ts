import { ApiProperty } from '@nestjs/swagger';
import { DuesPeriod } from '@prisma/client';

export class UpdateDuesPlanDto {
  @ApiProperty({
    description: 'Aidat planı adı',
    example: 'Aylık Aidat 2025',
    type: String,
    required: false,
  })
  name?: string;

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
    required: false,
  })
  amount?: number;

  @ApiProperty({
    description: 'Aidat dönemi',
    example: DuesPeriod.MONTHLY,
    enum: DuesPeriod,
    required: false,
  })
  period?: DuesPeriod;

  @ApiProperty({
    description: 'Plan aktif mi?',
    example: true,
    type: Boolean,
    required: false,
  })
  isActive?: boolean;
}
