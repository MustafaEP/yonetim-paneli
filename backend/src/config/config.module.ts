import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtConfigService } from './jwt.config';
import { DatabaseConfigService } from './database.config';

@Global()
@Module({
  providers: [ConfigService, JwtConfigService, DatabaseConfigService],
  exports: [ConfigService, JwtConfigService, DatabaseConfigService],
})
export class ConfigModule {}

