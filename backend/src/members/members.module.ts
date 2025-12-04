import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberScopeService } from './member-scope.service';

@Module({
  providers: [MembersService, MemberScopeService],
  controllers: [MembersController],
})
export class MembersModule {}
