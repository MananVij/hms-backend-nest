import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [HttpModule, ErrorLogModule, ConfigModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
