import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { getPermissionsForCustomRoles, ALL_PERMISSIONS } from './role-permissions.map';
import { Permission } from './permission.enum';
import { ConfigService } from '../config/config.service';
import { SystemService } from '../system/system.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => SystemService))
    private systemService: SystemService,
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
    // Bakım modu kontrolü
    const maintenanceMode = this.configService.getSystemSettingBoolean('MAINTENANCE_MODE', false);
    
    if (maintenanceMode) {
      // Bakım modunda sadece ADMIN rolüne sahip kullanıcılar giriş yapabilir
      const user = await this.usersService.findByEmail(dto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Kullanıcının ADMIN rolüne sahip olup olmadığını kontrol et
      const userWithRoles = user as User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> };
      const customRoleNames = userWithRoles.customRoles?.map(r => r.name) || [];
      const isAdmin = customRoleNames.includes('ADMIN');

      if (!isAdmin) {
        const maintenanceMessage = this.configService.getSystemSetting('MAINTENANCE_MESSAGE', 'Sistem bakım modunda. Lütfen daha sonra tekrar deneyin.');
        throw new ServiceUnavailableException(maintenanceMessage);
      }

      // ADMIN ise normal login işlemini devam ettir
      const validatedUser = await this.validateUser(dto.email, dto.password);
      const validatedUserWithRoles = validatedUser as User & { customRoles?: Array<{ name: string; permissions?: Array<{ permission: string }> }> };
      const payload = this.buildUserPayload(validatedUserWithRoles);
      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: validatedUser.id,
          email: validatedUser.email,
          firstName: validatedUser.firstName,
          lastName: validatedUser.lastName,
          roles: customRoleNames,
          permissions: payload.permissions,
        },
      };
    }

    // Normal login işlemi (bakım modu kapalı)
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

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    // Logout işlemi için log kaydı oluştur
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
      // Log kaydı başarısız olsa bile işlemi durdurma
      console.error('Logout log kaydı oluşturulamadı:', error);
    }

    return { message: 'Logout başarılı' };
  }
}
