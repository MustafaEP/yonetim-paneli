import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../config/config.service';
import { UsersService } from '../../users/users.service';
import {
  ALL_PERMISSIONS,
  getPermissionsForCustomRoles,
} from '../role-permissions.map';
import type { Permission } from '../permission.enum';

const USER_CACHE_TTL_MS = 60 * 1000; // 1 dakika – DB yükünü azaltır

interface CachedUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: Permission[];
}

interface CacheSlot {
  data: CachedUser;
  expiresAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly userCache = new Map<string, CacheSlot>();

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

  async validate(payload: any): Promise<CachedUser> {
    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Invalid token');

    const now = Date.now();
    const slot = this.userCache.get(userId);
    if (slot && slot.expiresAt > now) {
      return slot.data;
    }

    const dbUser = await this.usersService.findById(userId);
    if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
      this.userCache.delete(userId);
      throw new UnauthorizedException('Invalid token');
    }

    let roles: string[] = Array.isArray(payload?.roles) ? payload.roles : [];
    let permissions: Permission[] = Array.isArray(payload?.permissions)
      ? payload.permissions
      : [];

    const anyDbUser = dbUser as any;
    if (Array.isArray(anyDbUser.customRoles)) {
      roles = anyDbUser.customRoles.map((r: any) => r?.name).filter(Boolean);
      const customRolePermissions: Permission[] = [];
      for (const role of anyDbUser.customRoles) {
        if (Array.isArray(role?.permissions)) {
          for (const perm of role.permissions) {
            if (perm?.permission)
              customRolePermissions.push(perm.permission as Permission);
          }
        }
      }
      const isAdmin = roles.includes('ADMIN');
      permissions = isAdmin
        ? ALL_PERMISSIONS
        : getPermissionsForCustomRoles(customRolePermissions);
    }

    const data: CachedUser = {
      userId: dbUser.id,
      email: dbUser.email,
      roles,
      permissions,
    };
    this.userCache.set(userId, { data, expiresAt: now + USER_CACHE_TTL_MS });
    return data;
  }
}
