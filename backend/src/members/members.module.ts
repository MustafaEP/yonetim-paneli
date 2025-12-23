import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberScopeService } from './member-scope.service';
import { MemberHistoryService } from './member-history.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [MembersService, MemberScopeService, MemberHistoryService],
  controllers: [MembersController],
  exports: [MemberScopeService, MemberHistoryService],
})
export class MembersModule {}
