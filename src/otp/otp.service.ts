import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { SmsService } from '../sms/sms.service';
import * as bcrypt from 'bcrypt';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async generateOtp(phoneNumber: string): Promise<void> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);
      console.log(otp);

      const ttl = this.configService.get<number>('OTP_EXPIRATION_TIME');
      await this.redisService.set(phoneNumber, hashedOtp, ttl);

      const message = `Your OTP is: ${otp}. It will expire in ${ttl / 60} minutes.`;
      await this.smsService.sendSms(`${phoneNumber}`, message);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to generate OTP: ${error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        'Unable to send OTP at the moment. Pleaser try again later.',
      );
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const hashedOtp = await this.redisService.get(phoneNumber);
      if (!hashedOtp) {
        return false;
      }

      const isValid = await bcrypt.compare(otp, hashedOtp);
      if (isValid) {
        await this.redisService.del(phoneNumber);
        return true;
      }
      return false;
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to verify OTP: ${error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        'Unable to verify OTP at the moment. Pleaser try again later.',
      );
    }
  }
}
