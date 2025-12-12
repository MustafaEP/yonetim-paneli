import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mevcut kullanıcı bilgilerini getir', description: 'JWT token\'dan kullanıcı bilgilerini döner' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı bilgileri',
    schema: {
      example: {
        id: 'user-uuid-123',
        email: 'user@example.com',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        roles: ['ADMIN'],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async getMe(@CurrentUser() user: CurrentUserData) {
    const dbUser = await this.usersService.findById(user.userId);

    if (!dbUser) {
      // Bu userId'ye ait kullanıcı yoksa 404 fırlat
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Type assertion - findById customRoles'i include ediyor
    const userWithRoles = dbUser as typeof dbUser & { customRoles?: Array<{ name: string; permissions: Array<{ permission: string }> }> };

    // İzinleri topla
    const permissions: string[] = [];
    if (userWithRoles.customRoles) {
      userWithRoles.customRoles.forEach((role) => {
        role.permissions.forEach((perm) => {
          if (!permissions.includes(perm.permission)) {
            permissions.push(perm.permission);
          }
        });
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      roles: userWithRoles.customRoles?.map(r => r.name) || [],
      permissions,
    };
  }

  @Permissions(Permission.USER_LIST)
  @Get()
  @ApiOperation({ summary: 'Tüm kullanıcıları listele', description: 'Sadece USER_LIST yetkisi olan kullanıcılar erişebilir' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı listesi',
    schema: {
      type: 'array',
      items: {
        example: {
          id: 'user-uuid-123',
          email: 'user@example.com',
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          roles: ['ADMIN'],
          isActive: true,
        },
      },
    },
  })
  async getAllUsers() {
    // Soft delete'li olanlar gelmeyecek (deletedAt null filtre)
    const users = await this.usersService.findAll();
    return users.map((u) => {
      // Type assertion - findAll customRoles'i include ediyor
      const userWithRoles = u as typeof u & { customRoles?: Array<{ name: string }> };
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: userWithRoles.customRoles?.map(r => r.name) || [],
        isActive: u.isActive,
      };
    });
  }

  @Permissions(Permission.USER_VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Kullanıcı detayını getir', description: 'ID ile kullanıcı bilgilerini getirir' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'user-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı bilgileri',
    schema: {
      example: {
        id: 'user-uuid-123',
        email: 'user@example.com',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        roles: ['ADMIN'],
        isActive: true,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id); // id string ise

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Type assertion - findById customRoles'i include ediyor
    const userWithRoles = user as typeof user & { customRoles?: Array<{ name: string; permissions: Array<{ permission: string }> }> };

    // İzinleri topla
    const permissions: string[] = [];
    if (userWithRoles.customRoles) {
      userWithRoles.customRoles.forEach((role) => {
        role.permissions.forEach((perm) => {
          if (!permissions.includes(perm.permission)) {
            permissions.push(perm.permission);
          }
        });
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: userWithRoles.customRoles?.map(r => r.name) || [],
      permissions,
      isActive: user.isActive,
    };
  }

  @Permissions(Permission.USER_ASSIGN_ROLE)
  @Patch(':id/roles')
  @ApiOperation({ summary: 'Kullanıcı rollerini güncelle', description: 'Kullanıcıya özel roller atar' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'user-uuid-123' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customRoleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Özel rol ID\'leri',
        },
      },
      required: ['customRoleIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı rolleri başarıyla güncellendi',
  })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() body: { customRoleIds: string[] },
  ) {
    const updated = await this.usersService.updateUserRoles(id, body.customRoleIds);
    if (!updated) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const userWithRoles = updated as typeof updated & { customRoles?: Array<{ name: string; permissions: Array<{ permission: string }> }> };

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      roles: userWithRoles.customRoles?.map(r => r.name) || [],
      permissions: userWithRoles.customRoles?.flatMap(r => r.permissions.map(p => p.permission)) || [],
      isActive: updated.isActive,
    };
  }

}
