import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../auth/permission.enum';

export class RoleResponseDto {
  @ApiProperty({
    description: 'Rol ID',
    example: 'role-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Rol adı',
    example: 'Muhasebe Uzmanı',
  })
  name: string;

  @ApiProperty({
    description: 'Rol açıklaması',
    example: 'Muhasebe işlemlerini yönetebilir',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Rol aktif mi?',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Rol izinleri',
    example: [Permission.DUES_PLAN_MANAGE, Permission.DUES_PAYMENT_ADD],
    enum: Permission,
    isArray: true,
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'Oluşturulma tarihi',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Güncellenme tarihi',
  })
  updatedAt: Date;
}

export class SystemRoleResponseDto {
  @ApiProperty({
    description: 'Sistem rolü adı',
    example: 'ADMIN',
  })
  name: string;

  @ApiProperty({
    description: 'Rol izinleri',
    enum: Permission,
    isArray: true,
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'Sistem rolü mü?',
    example: true,
  })
  isSystemRole: boolean;
}

