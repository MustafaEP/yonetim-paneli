import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { MembersModule } from './members/members.module';
import { RegionsModule } from './regions/regions.module';
import { ConfigModule } from './config/config.module';
import { RolesModule } from './roles/roles.module';
import { ContentModule } from './content/content.module';
import { SystemModule } from './system/system.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AccountingModule } from './accounting/accounting.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    MembersModule,
    RegionsModule,
    RolesModule,
    ContentModule,
    SystemModule,
    NotificationsModule,
    ReportsModule,
    InstitutionsModule,
    ApprovalsModule,
    AccountingModule,
    PaymentsModule,
    DocumentsModule,
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
