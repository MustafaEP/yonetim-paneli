import { Module } from '@nestjs/common';
import { DuesService } from './dues.service';
import { DuesController } from './dues.controller';
import { MemberScopeService } from '../members/member-scope.service';

@Module({
  providers: [DuesService, MemberScopeService],
  controllers: [DuesController],
})
export class DuesModule {}
