import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtConfigService } from './jwt.config';
import { DatabaseConfigService } from './database.config';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ConfigService, JwtConfigService, DatabaseConfigService],
  exports: [ConfigService, JwtConfigService, DatabaseConfigService],
})
export class ConfigModule {}
