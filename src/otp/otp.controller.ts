import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateOtp(
    @Body('phoneNumber') phoneNumber: string,
  ): Promise<{ message: string }> {
    try {
      await this.otpService.generateOtp(phoneNumber);
      return { message: 'OTP has been sent to your phone number.' };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): Promise<{ success: boolean }> {
    try {
      const isValid = await this.otpService.verifyOtp(phoneNumber, otp);
      return { success: isValid };
    } catch (error) {
      throw error;
    }
  }
}
