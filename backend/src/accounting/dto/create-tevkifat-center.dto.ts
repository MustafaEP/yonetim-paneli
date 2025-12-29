import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTevkifatCenterDto {
  @ApiProperty({ description: 'Tevkifat merkezi adı', example: 'Sağlık Bakanlığı Tevkifat Merkezi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Tevkifat ünvanı (opsiyonel)', example: 'Müdür', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Kod (opsiyonel)', example: 'SB-TEV-001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: 'Açıklama (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Adres (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'İl ID (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({ description: 'İlçe ID (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  districtId?: string;
}
