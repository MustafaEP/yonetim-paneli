import { Module } from '@nestjs/common';
import { ProfessionsService } from './professions.service';
import { ProfessionsController } from './professions.controller';

@Module({
  providers: [ProfessionsService],
  controllers: [ProfessionsController],
  exports: [ProfessionsService],
})
export class ProfessionsModule {}

