import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { getPermissionsForCustomRoles, ALL_PERMISSIONS } from './role-permissions.map';
import { Permission } from './permission.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private buildUserPayload(user: User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> }) {
    // Custom rolleri için izinleri topla
    const customRolePermissions: Permission[] = [];
    const customRoleNames: string[] = [];
    
    if (user.customRoles && Array.isArray(user.customRoles)) {
      user.customRoles.forEach((customRole) => {
        if (customRole && customRole.name) {
          customRoleNames.push(customRole.name);
          // Permissions varsa ekle
          if (customRole.permissions && Array.isArray(customRole.permissions)) {
            customRole.permissions.forEach((perm) => {
              if (perm && perm.permission) {
                customRolePermissions.push(perm.permission as Permission);
              }
            });
          }
        }
      });
    }

    // ADMIN rolü kontrolü - CustomRole'de "ADMIN" adıyla kontrol et
    const isAdmin = customRoleNames.includes('ADMIN');
    
    // Eğer ADMIN ise tüm yetkilere sahip
    const permissions = isAdmin ? ALL_PERMISSIONS : getPermissionsForCustomRoles(customRolePermissions);

    return {
      sub: user.id,
      email: user.email,
      roles: customRoleNames, // Artık CustomRole isimlerini gönderiyoruz
      permissions: permissions || [], // Boş array fallback
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    // Type assertion - findByEmail customRoles'i include ediyor
    const userWithRoles = user as User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> };
    const payload = this.buildUserPayload(userWithRoles);

    const accessToken = await this.jwtService.signAsync(payload);

    // CustomRole isimlerini al
    const customRoleNames = userWithRoles.customRoles?.map(r => r.name) || [];

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: customRoleNames,
        permissions: payload.permissions,
      },
    };
  }
}
