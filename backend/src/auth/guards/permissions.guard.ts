import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private hasPermissionWithLegacySupport(
    userPermissions: Permission[],
    requiredPermission: Permission,
  ): boolean {
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Backward compatibility for renamed tevkifat permissions
    if (
      requiredPermission === Permission.TEVKIFAT_VIEW &&
      userPermissions.includes('ACCOUNTING_VIEW' as Permission)
    ) {
      return true;
    }
    if (
      requiredPermission === Permission.TEVKIFAT_EXPORT &&
      userPermissions.includes('ACCOUNTING_EXPORT' as Permission)
    ) {
      return true;
    }

    return false;
  }

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
    return requiredPermissions.some((p) =>
      this.hasPermissionWithLegacySupport(userPermissions, p),
    );
  }
}
