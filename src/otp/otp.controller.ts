import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  async sendOtp(@Body('phoneNumber') phoneNumber: string): Promise<object> {
    // TODO: - Hardcoded for testing
    return {
      status: 'succeess',
      message: 'Otp sent successfully.',
    };
    return this.otpService.sendOtp(phoneNumber);
  }

  @Post('verify')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): Promise<object> {
    // TODO: - Hardcoded for testing
    return {
      status: 'success',
      message: 'OTP verified successfully',
    };
    return this.otpService.verifyOtp(phoneNumber, otp);
  }
}
