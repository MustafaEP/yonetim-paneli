import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { MembersModule } from './members/members.module';
import { RegionsModule } from './regions/regions.module';
import { DuesModule } from './dues/dues.module';

@Module({
  imports: [
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    MembersModule,
    RegionsModule,
    DuesModule,
  ],
  providers: [
    // 1. JWT
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. Permission
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
