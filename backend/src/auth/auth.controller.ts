import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
    return this.authService.login(dto);
  }
}
