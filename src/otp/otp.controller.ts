import {
  Controller,
  Post,
  Body,
  Req,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';
import { Request } from 'src/interfaces/request.interface';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(JwtAuthGuard)
  async verifyOtp(
    @QueryRunnerParam() queryRunner: QueryRunner,
    @Req() req: Request,
    @Body('phoneNumber') phoneNumber: string,
    @Body('clinicId') clinicId: number,
    @Body('role') role: string,
  ): Promise<object> {
    try {
      const userId = req?.user?.uid;
      return this.otpService.verifyOtp(
        queryRunner,
        userId,
        phoneNumber,
        clinicId,
        role,
      );
    } catch (error) {
      throw error;
    }
  }
}
