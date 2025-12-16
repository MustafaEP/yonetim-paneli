import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBranchDto {
  @ApiProperty({ description: 'Şube adı', example: 'İstanbul Şubesi', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Şube kodu', example: 'IST-001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'İl ID', example: 'province-uuid-123', required: false })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({ description: 'İlçe ID', example: 'district-uuid-456', required: false })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiProperty({ description: 'Adres', example: 'Atatürk Cad. No:1', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Telefon', example: '02121234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'E-posta', example: 'sube@sendika.org', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Aktif mi?', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
