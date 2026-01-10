import { Module } from '@nestjs/common';
import { PanelUserApplicationsService } from './panel-user-applications.service';
import { PanelUserApplicationsController } from './panel-user-applications.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [PanelUserApplicationsService],
  controllers: [PanelUserApplicationsController],
  exports: [PanelUserApplicationsService],
})
export class PanelUserApplicationsModule {}

