import { Module, forwardRef } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ConfigModule)],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}

