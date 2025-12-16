import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RoleResponseDto } from './dto/role-response.dto';
// Role enum artık kullanılmıyor, CustomRole kullanılıyor
import { Permission } from '../auth/permission.enum';
import { ALL_PERMISSIONS } from '../auth/role-permissions.map';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async listRoles(): Promise<Array<RoleResponseDto | { name: string; permissions: Permission[]; isSystemRole: boolean }>> {
    // Custom rolleri getir (veritabanından gelen tüm roller)
    const customRoles = await this.prisma.customRole.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        permissions: true,
        province: true,
        district: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Sadece ADMIN sistem rolü olarak göster (artık CustomRole olarak da eklenmiş olabilir)
    // Sistem rolleri artık CustomRole tablosunda, bu yüzden burada göstermeye gerek yok
    const systemRoles: Array<{ name: string; permissions: Permission[]; isSystemRole: boolean }> = [];

    // Custom rolleri DTO formatına çevir
    const customRolesDto = customRoles.map((role) => {
      // ADMIN rolü için tüm izinleri göster (veritabanında saklanmasa bile)
      const permissions = role.name === 'ADMIN' 
        ? ALL_PERMISSIONS 
        : role.permissions.map((p) => p.permission as Permission);
      
      return {
        id: role.id,
        name: role.name,
        description: role.description ?? undefined,
        isActive: role.isActive,
        permissions,
        provinceId: role.provinceId ?? undefined,
        province: role.province ? {
          id: role.province.id,
          name: role.province.name,
          code: role.province.code ?? undefined,
        } : undefined,
        districtId: role.districtId ?? undefined,
        district: role.district ? {
          id: role.district.id,
          name: role.district.name,
          provinceId: role.district.provinceId,
        } : undefined,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    });

    return [...systemRoles, ...customRolesDto];
  }

  async getRoleById(id: string): Promise<RoleResponseDto & { users?: Array<{ id: string; email: string; firstName: string; lastName: string }> }> {
    const role = await this.prisma.customRole.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: true,
        province: true,
        district: true,
        users: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    // ADMIN rolü için tüm izinleri göster (veritabanında saklanmasa bile)
    const permissions = role.name === 'ADMIN' 
      ? ALL_PERMISSIONS 
      : role.permissions.map((p) => p.permission as Permission);

    return {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      isActive: role.isActive,
      permissions,
      provinceId: role.provinceId ?? undefined,
      province: role.province ? {
        id: role.province.id,
        name: role.province.name,
        code: role.province.code ?? undefined,
      } : undefined,
      districtId: role.districtId ?? undefined,
      district: role.district ? {
        id: role.district.id,
        name: role.district.name,
        provinceId: role.district.provinceId,
      } : undefined,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      users: role.users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    };
  }

  async createRole(dto: CreateRoleDto): Promise<RoleResponseDto> {
    // ADMIN rolü oluşturulamaz
    if (dto.name === 'ADMIN') {
      throw new BadRequestException('ADMIN rolü oluşturulamaz. Bu bir sistem rolüdür.');
    }

    // Rol adı unique kontrolü
    const existingRole = await this.prisma.customRole.findFirst({
      where: {
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingRole) {
      throw new ConflictException('Bu isimde bir rol zaten mevcut');
    }

    // ADMIN izinleri kontrolü
    this.validatePermissions(dto.permissions);

    // Rolü oluştur
    const role = await this.prisma.customRole.create({
      data: {
        name: dto.name,
        description: dto.description,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        permissions: {
          create: dto.permissions.map((permission) => ({
            permission,
          })),
        },
      },
      include: {
        permissions: true,
        province: true,
        district: true,
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      isActive: role.isActive,
      permissions: role.permissions.map((p) => p.permission as Permission),
      provinceId: role.provinceId ?? undefined,
      province: role.province ? {
        id: role.province.id,
        name: role.province.name,
        code: role.province.code ?? undefined,
      } : undefined,
      districtId: role.districtId ?? undefined,
      district: role.district ? {
        id: role.district.id,
        name: role.district.name,
        provinceId: role.district.provinceId,
      } : undefined,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.prisma.customRole.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    // ADMIN rolü düzenlenemez
    if (role.name === 'ADMIN') {
      throw new BadRequestException('ADMIN rolü düzenlenemez. Bu bir sistem rolüdür.');
    }

    // İsim değişiyorsa unique kontrolü
    if (dto.name && dto.name !== role.name) {
      // ADMIN adına değiştirilemez
      if (dto.name === 'ADMIN') {
        throw new BadRequestException('ADMIN rolü oluşturulamaz. Bu bir sistem rolüdür.');
      }

      const existingRole = await this.prisma.customRole.findFirst({
        where: {
          name: dto.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingRole) {
        throw new ConflictException('Bu isimde bir rol zaten mevcut');
      }
    }

    const updatedRole = await this.prisma.customRole.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
      },
      include: {
        permissions: true,
        province: true,
        district: true,
      },
    });

    return {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description ?? undefined,
      isActive: updatedRole.isActive,
      permissions: updatedRole.permissions.map((p) => p.permission as Permission),
      provinceId: updatedRole.provinceId ?? undefined,
      province: updatedRole.province ? {
        id: updatedRole.province.id,
        name: updatedRole.province.name,
        code: updatedRole.province.code ?? undefined,
      } : undefined,
      districtId: updatedRole.districtId ?? undefined,
      district: updatedRole.district ? {
        id: updatedRole.district.id,
        name: updatedRole.district.name,
        provinceId: updatedRole.district.provinceId,
      } : undefined,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
    };
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.prisma.customRole.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        users: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    // ADMIN rolü silinemez
    if (role.name === 'ADMIN') {
      throw new BadRequestException(
        'ADMIN rolü silinemez. Bu bir sistem rolüdür.',
      );
    }

    // Rol kullanıcılara atanmışsa silme
    if (role.users.length > 0) {
      throw new BadRequestException(
        'Bu rol kullanıcılara atanmış. Önce kullanıcılardan kaldırın.',
      );
    }

    // Soft delete
    await this.prisma.customRole.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateRolePermissions(
    id: string,
    dto: UpdateRolePermissionsDto,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.customRole.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı');
    }

    // ADMIN rolü izinleri düzenlenemez
    if (role.name === 'ADMIN') {
      throw new BadRequestException('ADMIN rolü izinleri düzenlenemez. Bu bir sistem rolüdür.');
    }

    // ADMIN izinleri kontrolü
    this.validatePermissions(dto.permissions);

    // Mevcut izinleri sil
    await this.prisma.customRolePermission.deleteMany({
      where: {
        roleId: id,
      },
    });

    // Yeni izinleri ekle
    await this.prisma.customRolePermission.createMany({
      data: dto.permissions.map((permission) => ({
        roleId: id,
        permission,
      })),
    });

    // Güncellenmiş rolü getir
    return this.getRoleById(id);
  }

  async getCustomRolePermissions(roleIds: string[]): Promise<Permission[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const permissions = await this.prisma.customRolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        role: {
          deletedAt: null,
          isActive: true,
        },
      },
      select: {
        permission: true,
      },
    });

    const uniquePermissions = new Set<Permission>();
    permissions.forEach((p) => {
      uniquePermissions.add(p.permission as Permission);
    });
    return Array.from(uniquePermissions);
  }

  private validatePermissions(permissions: Permission[]): void {
    // Custom role'lere tüm izinler verilebilir, ancak ADMIN özel durumda
    // Bu validation sadece bir güvenlik önlemi
    // Gerçek kontrol getPermissionsForRoles'de yapılacak (ADMIN her zaman tüm izinlere sahip)
  }
}

