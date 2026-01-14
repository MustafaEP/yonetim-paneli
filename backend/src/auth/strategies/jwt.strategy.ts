import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../config/config.service';
import { UsersService } from '../../users/users.service';
import { ALL_PERMISSIONS, getPermissionsForCustomRoles } from '../role-permissions.map';
import type { Permission } from '../permission.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: any) {
    // Token geçerli olsa bile, kullanıcı DB'de yoksa (örn. eski token / farklı DB) FK hataları üretir.
    // Bu yüzden her istekte user'ı doğrulayarak yoksa 401 döndürüyoruz.
    const dbUser = await this.usersService.findById(payload?.sub);
    if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
      throw new UnauthorizedException('Invalid token');
    }

    // Varsayılan: token'dan gelen roller/izinler (geriye uyumluluk)
    let roles: string[] = Array.isArray(payload?.roles) ? payload.roles : [];
    let permissions: Permission[] = Array.isArray(payload?.permissions) ? payload.permissions : [];

    // Mümkünse DB'deki roller/izinler ile kesin doğruluk sağla
    const anyDbUser = dbUser as any;
    if (Array.isArray(anyDbUser.customRoles)) {
      roles = anyDbUser.customRoles.map((r: any) => r?.name).filter(Boolean);

      const customRolePermissions: Permission[] = [];
      for (const role of anyDbUser.customRoles) {
        if (Array.isArray(role?.permissions)) {
          for (const perm of role.permissions) {
            if (perm?.permission) customRolePermissions.push(perm.permission as Permission);
          }
        }
      }

      const isAdmin = roles.includes('ADMIN');
      permissions = isAdmin ? ALL_PERMISSIONS : getPermissionsForCustomRoles(customRolePermissions);
    }

    return {
      userId: dbUser.id,
      email: dbUser.email,
      roles,
      permissions,
    };
  }
}

