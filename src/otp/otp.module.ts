import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { PatientModule } from 'src/patient/patient.module';

@Module({
  imports: [PatientModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
