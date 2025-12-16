import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTevkifatCenterDto {
  @ApiProperty({ description: 'Tevkifat merkezi adı', example: 'Sağlık Bakanlığı Tevkifat Merkezi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Kod (opsiyonel)', example: 'SB-TEV-001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: 'Açıklama (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
