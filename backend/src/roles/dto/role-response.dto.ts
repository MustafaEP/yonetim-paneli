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
    example: [Permission.MEMBER_LIST, Permission.MEMBER_VIEW],
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

  @ApiProperty({
    description: 'İl ID (MEMBER_LIST_BY_PROVINCE izni için)',
    example: 'province-uuid-123',
    required: false,
  })
  provinceId?: string;

  @ApiProperty({
    description: 'İl bilgisi (MEMBER_LIST_BY_PROVINCE izni için)',
    required: false,
  })
  province?: {
    id: string;
    name: string;
    code?: string;
  };

  @ApiProperty({
    description: 'İlçe ID (MEMBER_LIST_BY_PROVINCE izni için ilçe bazlı)',
    example: 'district-uuid-123',
    required: false,
  })
  districtId?: string;

  @ApiProperty({
    description: 'İlçe bilgisi (MEMBER_LIST_BY_PROVINCE izni için ilçe bazlı)',
    required: false,
  })
  district?: {
    id: string;
    name: string;
    provinceId: string;
  };
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

