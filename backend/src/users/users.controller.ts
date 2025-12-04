import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permission.enum';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserData) {
    const dbUser = await this.usersService.findById(user.userId);

    if (!dbUser) {
      // Bu userId'ye ait kullanıcı yoksa 404 fırlat
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      id: dbUser.id,          // 🟢 artık non-null
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      roles: dbUser.roles,
    };
  }

  // Bu endpoint sadece ADMIN + MODERATOR görebilsin
  @Permissions(Permission.USER_LIST)
  @Get()
  async getAllUsers() {
    // Soft delete’li olanlar gelmeyecek (deletedAt null filtre)
    const users = await this.usersService.findAll();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      roles: u.roles,
      isActive: u.isActive,
    }));
  }

  @Permissions(Permission.USER_VIEW)
  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id); // id string ise

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      isActive: user.isActive,
    };
  }

}
