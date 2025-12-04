import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        // Tip uyuşmazlığını çözüyoruz
        expiresIn: jwtExpiresIn as any,
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
