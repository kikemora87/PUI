import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PuiService } from './pui.service';
import { PuiAuthService } from './pui-auth.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 0,
    }),
    ConfigModule,
    AuditModule,
  ],
  providers: [PuiService, PuiAuthService],
  exports: [PuiService, PuiAuthService],
})
export class PuiModule {}
