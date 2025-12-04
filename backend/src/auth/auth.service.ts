import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User, Role } from '@prisma/client';
import { getPermissionsForRoles } from './role-permissions.map'; // 🔹 BUNU EKLE

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private buildUserPayload(user: User) {
    const roles = user.roles as Role[];
    const permissions = getPermissionsForRoles(roles); // 🔹 rollerden izinleri üret

    return {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions, // 🔹 JWT içine koyduk
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

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const payload = this.buildUserPayload(user);

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        permissions: payload.permissions, // 🔹 frontend’e de gönder
      },
    };
  }
}
