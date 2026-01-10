import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ApproveMemberDto {
  @ApiProperty({
    description: 'Üye kayıt numarası',
    example: 'UYE-00001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiProperty({
    description: 'Yönetim kurulu karar tarihi',
    example: '2025-01-15',
    type: String,
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  boardDecisionDate?: string;

  @ApiProperty({
    description: 'Yönetim kurulu karar defter no',
    example: '2025/01',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  boardDecisionBookNo?: string;
}














