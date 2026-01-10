import { Module } from '@nestjs/common';
import { MemberGroupsService } from './member-groups.service';
import { MemberGroupsController } from './member-groups.controller';

@Module({
  providers: [MemberGroupsService],
  controllers: [MemberGroupsController],
  exports: [MemberGroupsService],
})
export class MemberGroupsModule {}

