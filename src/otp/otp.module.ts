import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { RedisModule } from '../redis/redis.module';
import { SmsModule } from '../sms/sms.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    RedisModule,
    SmsModule,
    ErrorLogModule
  ],
  providers: [OtpService],
  controllers: [OtpController],
})
export class OtpModule {}