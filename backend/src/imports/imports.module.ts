import { Module } from '@nestjs/common';
import { MemberImportController } from './controllers/member-import.controller';
import { MemberImportValidationService } from './services/member-import-validation.service';

@Module({
  controllers: [MemberImportController],
  providers: [MemberImportValidationService],
  exports: [MemberImportValidationService],
})
export class ImportsModule {}
