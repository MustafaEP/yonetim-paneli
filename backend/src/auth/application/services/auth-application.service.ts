/**
 * Auth Application Service
 */
import { Injectable, UnauthorizedException, ServiceUnavailableException, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../../dto/login.dto';
import { User } from '@prisma/client';
import { getPermissionsForCustomRoles, ALL_PERMISSIONS } from '../../role-permissions.map';
import { Permission } from '../../permission.enum';
import { ConfigService } from '../../../config/config.service';
import { SystemService } from '../../../system/system.service';
import { UserSession } from '../../domain/entities/user-session.entity';

@Injectable()
export class AuthApplicationService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => SystemService))
    private systemService: SystemService,
  ) {}

  private buildUserPayload(user: User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> }) {
    const customRolePermissions: Permission[] = [];
    const customRoleNames: string[] = [];
    
    if (user.customRoles && Array.isArray(user.customRoles)) {
      user.customRoles.forEach((customRole) => {
        if (customRole && customRole.name) {
          customRoleNames.push(customRole.name);
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

    const isAdmin = customRoleNames.includes('ADMIN');
    const permissions = isAdmin ? ALL_PERMISSIONS : getPermissionsForCustomRoles(customRolePermissions);

    return {
      sub: user.id,
      email: user.email,
      roles: customRoleNames,
      permissions: permissions || [],
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
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

  async login(dto: LoginDto): Promise<UserSession> {
    // Maintenance mode check
    const maintenanceMode = this.configService.getSystemSettingBoolean('MAINTENANCE_MODE', false);
    
    if (maintenanceMode) {
      const user = await this.usersService.findByEmail(dto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const userWithRoles = user as User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> };
      const customRoleNames = userWithRoles.customRoles?.map(r => r.name) || [];
      const isAdmin = customRoleNames.includes('ADMIN');

      if (!isAdmin) {
        const maintenanceMessage = this.configService.getSystemSetting('MAINTENANCE_MESSAGE', 'Sistem bakım modunda. Lütfen daha sonra tekrar deneyin.');
        throw new ServiceUnavailableException(maintenanceMessage);
      }
    }

    const validatedUser = await this.validateUser(dto.email, dto.password);
    const validatedUserWithRoles = validatedUser as User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> };
    const payload = this.buildUserPayload(validatedUserWithRoles);
    const accessToken = await this.jwtService.signAsync(payload);

    const customRoleNames = validatedUserWithRoles.customRoles?.map(r => r.name) || [];

    return UserSession.create({
      userId: validatedUser.id,
      email: validatedUser.email,
      roles: customRoleNames,
      permissions: payload.permissions,
      accessToken,
    });
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    try {
      if (this.systemService) {
        await this.systemService.createLog({
          action: 'LOGOUT',
          entityType: 'AUTH',
          userId,
          details: {
            success: true,
          },
          ipAddress,
          userAgent,
        });
      }
    } catch (error) {
      console.error('Logout log kaydı oluşturulamadı:', error);
    }

    return { message: 'Logout başarılı' };
  }
}
