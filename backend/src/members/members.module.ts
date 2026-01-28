import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './presentation/controllers/members.controller';
import { MemberScopeService } from './member-scope.service';
import { MemberHistoryService } from './member-history.service';
import { DocumentsModule } from '../documents/documents.module';
import { MemberExceptionFilter } from './presentation/filters/member-exception.filter';
import { MemberValidationPipe } from './presentation/pipes/member-validation.pipe';
import { MemberApprovalApplicationService } from './application/services/member-approval-application.service';
import { MemberActivationApplicationService } from './application/services/member-activation-application.service';
import { MemberRejectionApplicationService } from './application/services/member-rejection-application.service';
import { MemberCancellationApplicationService } from './application/services/member-cancellation-application.service';
import { MemberUpdateApplicationService } from './application/services/member-update-application.service';
import { MemberCreationApplicationService } from './application/services/member-creation-application.service';
import { PrismaMemberRepository } from './infrastructure/persistence/prisma-member.repository';
import { MemberRepository } from './domain/repositories/member.repository.interface';
import { MemberRegistrationDomainService, MembershipConfigAdapter } from './domain/services/member-registration-domain.service';
import { PrismaMembershipConfigAdapter } from './infrastructure/config/membership-config.adapter';

@Module({
  imports: [DocumentsModule],
  providers: [
    MembersService,
    MemberScopeService,
    MemberHistoryService,
    MemberExceptionFilter,
    MemberValidationPipe,
    MemberApprovalApplicationService,
    MemberActivationApplicationService,
    MemberRejectionApplicationService,
    MemberCancellationApplicationService,
    MemberUpdateApplicationService,
    MemberCreationApplicationService,
    MemberRegistrationDomainService,
    {
      provide: 'MemberRepository',
      useClass: PrismaMemberRepository,
    },
    {
      provide: 'MembershipConfigAdapter',
      useClass: PrismaMembershipConfigAdapter,
    },
    PrismaMemberRepository,
    PrismaMembershipConfigAdapter,
  ],
  controllers: [MembersController],
  exports: [MemberScopeService, MemberHistoryService],
})
export class MembersModule {}
