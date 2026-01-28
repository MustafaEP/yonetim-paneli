/**
 * Auth Controller (Presentation Layer)
 */
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthApplicationService } from '../../application/services/auth-application.service';
import { AuthService } from '../../auth.service'; // Legacy service
import { LoginDto } from '../../dto/login.dto';
import { Public } from '../../decorators/public.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { CurrentUserData } from '../../decorators/current-user.decorator';
import type { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, // Legacy service
    private authApplicationService: AuthApplicationService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi', description: 'E-posta ve şifre ile giriş yaparak JWT token alır' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Giriş başarılı',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user-uuid-123',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          roles: ['ADMIN'],
          permissions: ['USER_LIST', 'USER_VIEW', 'USER_CREATE', 'MEMBER_LIST'],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  async login(@Body() dto: LoginDto) {
    const session = await this.authApplicationService.login(dto);
    // Return legacy format for backward compatibility
    return {
      accessToken: session.accessToken,
      user: {
        id: session.userId,
        email: session.email,
        roles: session.roles,
        permissions: session.permissions,
      },
    };
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kullanıcı çıkışı', description: 'Kullanıcı oturumunu sonlandırır ve log kaydı oluşturur' })
  @ApiResponse({ status: 200, description: 'Çıkış başarılı' })
  async logout(@CurrentUser() user: CurrentUserData, @Req() request: Request) {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] || 'unknown';
    return this.authApplicationService.logout(user.userId, ipAddress, userAgent);
  }

  private getIpAddress(request: Request): string {
    return (
      request.ip ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      (request.socket as any)?.remoteAddress ||
      'unknown'
    );
  }
}
