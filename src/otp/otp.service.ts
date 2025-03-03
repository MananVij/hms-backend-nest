import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PatientService } from 'src/patient/patient.service';
import { Twilio } from 'twilio';
import { QueryRunner } from 'typeorm';

@Injectable()
export class OtpService {
  private client: Twilio;

  constructor(private readonly patientService: PatientService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.client = new Twilio(accountSid, authToken);
  }

  async sendOtp(phoneNumber: string): Promise<object> {
    try {
      const serviceSid = process.env.TWILIO_SERVICE_SID;
      const verification = await this.client.verify.v2
        .services(serviceSid)
        .verifications.create({
          to: `+91${phoneNumber}`,
          channel: 'sms',
        });

      if (verification.status !== 'pending') {
        throw new Error('Failed to send OTP. Please try again!');
      }

      return {
        status: 'succeess',
        message: 'Otp sent successfully.',
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new BadRequestException('An unexpected error occurred');
    }
  }

  async verifyOtp(
    queryRunner: QueryRunner,
    userId: string,
    phoneNumber: string,
    clinicId: number,
    otp: string,
  ): Promise<object> {
    try {
      const serviceSid = process.env.TWILIO_SERVICE_SID;

      const verificationCheck = await this.client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({
          to: `+91${phoneNumber}`,
          code: otp,
        });

      if (verificationCheck.status !== 'approved') {
        throw new BadRequestException('Invalid or expired otp');
      // }
      const users = await this.patientService.findPatientsByPhoneNumber(
        queryRunner,
        userId,
        clinicId,
        phoneNumber,
      );

      return {
        users,
        message: 'OTP verified successfully',
        isVerified: true,
      };
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(
            'Something Went Wrong. Please try again!',
          );
    }
  }
}
