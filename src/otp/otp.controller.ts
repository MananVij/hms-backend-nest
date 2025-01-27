import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  async sendOtp(@Body('phoneNumber') phoneNumber: string): Promise<object> {
    try {
      return this.otpService.sendOtp(phoneNumber);
    } catch (error) {
      throw error;
    }
  }

  @Post('verify')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): Promise<object> {
    try {
      return this.otpService.verifyOtp(phoneNumber, otp);
    } catch (error) {
      throw error;
    }
  }
}
