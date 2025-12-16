import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Rol adı',
    example: 'Muhasebe Uzmanı',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Rol açıklaması',
    example: 'Muhasebe işlemlerini yönetebilir',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Rol aktif mi?',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'İl ID (MEMBER_LIST_BY_PROVINCE izni için)',
    example: 'province-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({
    description: 'İlçe ID (MEMBER_LIST_BY_PROVINCE izni için ilçe bazlı)',
    example: 'district-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  districtId?: string;
}

