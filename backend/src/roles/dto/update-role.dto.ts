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
}

