import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  async sendOtp(@Body('phoneNumber') phoneNumber: string): Promise<object> {
    return this.otpService.sendOtp(phoneNumber);
  }

  @Post('verify')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): Promise<object> {
    return this.otpService.verifyOtp(phoneNumber, otp);
  }
}
