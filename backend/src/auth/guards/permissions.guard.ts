import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);

    // Endpoint'e @Permissions konmadıysa → sadece JWT yeterli
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      console.log('[PermissionsGuard] No user found in request');
      return false;
    }

    // ADMIN rolü kontrolü - ADMIN ise tüm permission'lara sahip (en önemli kontrol)
    if (user.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN')) {
      console.log('[PermissionsGuard] User is ADMIN, granting access');
      return true;
    }

    // Permission kontrolü
    if (!user.permissions || !Array.isArray(user.permissions)) {
      // Eğer permissions yoksa ve ADMIN değilse → erişim yok
      console.log('[PermissionsGuard] No permissions found', { 
        hasRoles: !!user.roles, 
        roles: user.roles,
        hasPermissions: !!user.permissions,
        permissions: user.permissions 
      });
      return false;
    }

    // JWT payload'ında permissions zaten var (CustomRole'lerden hesaplanmış)
    const userPermissions: Permission[] = user.permissions;

    // En az bir permission match etsin (OR mantığı)
    const hasPermission = requiredPermissions.some((p) => userPermissions.includes(p));
    if (!hasPermission) {
      console.log('[PermissionsGuard] Permission check failed', {
        required: requiredPermissions,
        userHas: userPermissions,
        userRoles: user.roles
      });
    }
    return hasPermission;
  }
}

