import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateInstitutionDto {
  @ApiProperty({ description: 'Kurum adı', example: 'ABC Kurumu' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'İl ID (opsiyonel)', example: 'province-uuid-123', required: false })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({ description: 'İlçe ID', example: 'district-uuid-456', required: false })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiProperty({ description: 'Kurum Sicil No', example: '12345', required: false })
  @IsString()
  @IsOptional()
  kurumSicilNo?: string;

  @ApiProperty({ description: 'Görev Birimi', example: 'Müdürlük', required: false })
  @IsString()
  @IsOptional()
  gorevBirimi?: string;

  @ApiProperty({ description: 'Kurum Adresi', example: 'İstanbul, Kadıköy', required: false })
  @IsString()
  @IsOptional()
  kurumAdresi?: string;

  @ApiProperty({ description: 'Kadro Ünvan Kodu', example: 'K001', required: false })
  @IsString()
  @IsOptional()
  kadroUnvanKodu?: string;
}

export class UpdateInstitutionDto extends CreateInstitutionDto {
  @ApiProperty({ description: 'Aktif mi?', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


