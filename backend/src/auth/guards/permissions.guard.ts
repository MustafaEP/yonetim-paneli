import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // Endpoint'e @Permissions konmadıysa → sadece JWT yeterli
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // ADMIN rolü kontrolü - ADMIN ise tüm permission'lara sahip
    if (
      user.roles &&
      Array.isArray(user.roles) &&
      user.roles.includes('ADMIN')
    ) {
      return true;
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }

    const userPermissions: Permission[] = user.permissions;
    return requiredPermissions.some((p) => userPermissions.includes(p));
  }
}
