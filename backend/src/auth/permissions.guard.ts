import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Permission } from './permission.enum';
import { getPermissionsForRoles } from './role-permissions.map';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);

    // Endpoint’e @Permissions konmadıysa → sadece JWT yeterli
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    const userRoles: Role[] = user.roles;
    const userPermissions = getPermissionsForRoles(userRoles);

    // En az bir permission match etsin (OR mantığı)
    return requiredPermissions.some((p) => userPermissions.includes(p));
  }
}
