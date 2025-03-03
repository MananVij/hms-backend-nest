import { Controller, Post, Body, Req } from '@nestjs/common';
import { OtpService } from './otp.service';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';
import { Request } from 'src/interfaces/request.interface';

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
    @QueryRunnerParam() queryRunner: QueryRunner,
    @Req() req: Request,
    @Body('phoneNumber') phoneNumber: string,
    @Body('clinicId') clinicId: number,
    @Body('otp') otp: string,
  ): Promise<object> {
    try {
      const userId = req?.user?.uid;
      return this.otpService.verifyOtp(
        queryRunner,
        userId,
        phoneNumber,
        clinicId,
        otp,
      );
    } catch (error) {
      throw error;
    }
  }
}
