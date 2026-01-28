import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '../config/config.module';
import { JwtConfigService } from '../config/jwt.config';
import { SystemModule } from '../system/system.module';
import { AuthApplicationService } from './application/services/auth-application.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    forwardRef(() => SystemModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (jwtConfigService: JwtConfigService) =>
        jwtConfigService.createJwtOptions(),
      inject: [JwtConfigService],
    }),
  ],
  providers: [
    AuthService, // Legacy service for backward compatibility
    AuthApplicationService,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
