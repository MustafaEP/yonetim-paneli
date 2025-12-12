import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateDuesPaymentDto {
  @ApiProperty({
    description: 'Üye ID',
    example: 'member-uuid-123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({
    description: 'Aidat planı ID',
    example: 'plan-uuid-456',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({
    description: 'Ödenen tutar (TL)',
    example: 100.50,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Ödeme yılı',
    example: 2025,
    type: Number,
    minimum: 2000,
    maximum: 2100,
    required: false,
  })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  periodYear?: number;

  @ApiProperty({
    description: 'Ödeme ayı (1-12)',
    example: 1,
    type: Number,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  periodMonth?: number;

  @ApiProperty({
    description: 'Ödeme notu',
    example: 'Nakit ödeme',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
