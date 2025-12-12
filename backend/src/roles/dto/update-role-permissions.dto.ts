import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { Permission } from '../../auth/permission.enum';

export class UpdateRolePermissionsDto {
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

