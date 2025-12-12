import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Permission } from '../../auth/permission.enum';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Rol adı',
    example: 'Muhasebe Uzmanı',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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
    description: 'Rol izinleri',
    example: [Permission.DUES_PLAN_MANAGE, Permission.DUES_PAYMENT_ADD],
    enum: Permission,
    isArray: true,
  })
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

