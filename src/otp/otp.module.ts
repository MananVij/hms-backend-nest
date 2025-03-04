import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { PatientModule } from 'src/patient/patient.module';
import { HttpModule } from '@nestjs/axios';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [PatientModule, HttpModule, ErrorLogModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
