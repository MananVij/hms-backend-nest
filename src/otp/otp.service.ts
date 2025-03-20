import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { PatientService } from 'src/patient/patient.service';
import { User } from 'src/user/entity/user.enitiy';
import {
  UserClinic,
  UserRole,
} from 'src/user_clinic/entity/user_clinic.entity';
import { QueryRunner } from 'typeorm';

@Injectable()
export class OtpService {
  constructor(
    private readonly patientService: PatientService,
    private readonly httpService: HttpService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async sendOtp(phoneNumber: string): Promise<object> {
    if (!phoneNumber) {
      throw new InternalServerErrorException(
        'Recipient phone number is required.',
      );
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      throw new Error('Invalid recipient phone number format.');
    }

    const baseUrl = process.env.SMS_BASE_URL;
    const authToken = process.env.SMS_AUTH_TOKEN;
    if (!baseUrl || !authToken) {
      throw new Error('Missing SMS configuration in environment variables.');
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/send`, null, {
          headers: {
            authToken: authToken,
          },
          params: {
            flowType: 'SMS',
            countryCode: '91',
            mobileNumber: phoneNumber,
          },
        }),
      );
      if (response?.data?.responseCode === 200) {
        const verificationId = response?.data?.data?.verificationId;
        return {
          verificationId,
          status: 'succeess',
          message: 'Otp sent successfully.',
        };
      } else {
        throw new InternalServerErrorException(
          'Unable to Send SMS at the moment. Please try later.',
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to send SMS: ${error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        'Unable to Send SMS at the moment. Please try later.',
      );
    }
  }

  private async verifyOtpService(otp: string, verificationId: string) {
    const baseUrl = process.env.SMS_BASE_URL;
    const authToken = process.env.SMS_AUTH_TOKEN;
    if (!baseUrl || !authToken) {
      throw new Error('Missing SMS configuration in environment variables.');
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/validateOtp`, {
          headers: {
            authToken: authToken,
          },
          params: {
            code: otp,
            verificationId,
          },
        }),
      );
      if (response?.data.responseCode !== 200) {
        throw new InternalServerErrorException('Incorrect Otp');
      }
      return response;
    } catch (error) {
      const responseCode = error?.response?.data?.responseCode;
      let msg = 'Something went wrong. Unable to verify at moment.';
      if (responseCode === 702) {
        msg = 'Invalid Otp';
      } else if (responseCode === 700) {
        msg = 'Verification Failed';
      } else if (responseCode === 703) {
        msg = 'Otp Already Verified';
      } else if (responseCode === 705) {
        msg = 'Otp Exipred';
      } else if (responseCode === 800) {
        msg = 'Maximum Limit Reached.';
      }
      throw new InternalServerErrorException(msg);
    }
  }

  async verifyOtp(
    queryRunner: QueryRunner,
    userId: string,
    phoneNumber: string,
    clinicId: number,
    otp: string,
    verificationId: string,
    role: string,
  ): Promise<object> {
    if (!phoneNumber) {
      throw new InternalServerErrorException(
        'Recipient phone number is required.',
      );
    }
    if (!/^\d{10}$/.test(`${phoneNumber}`)) {
      throw new Error('Invalid recipient phone number format.');
    }
    if (!otp) {
      throw new InternalServerErrorException('Otp is required.');
    }
    if (!/^\d{4}$/.test(`${otp}`)) {
      throw new Error('Invalid otp format.');
    }

    try {
      const response = await this.verifyOtpService(otp, verificationId);

      if (response?.data.responseCode !== 200) {
        throw new InternalServerErrorException('Incorrect Otp');
      }

      if (role === UserRole.PATIENT) {
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
      }
      const users = await queryRunner.manager.find(User, {
        where: { phoneNumber },
        relations: ['metaData'],
        select: {
          name: true,
          uid: true,
          publicIdentifier: true,
          phoneNumber: true,
          metaData: {
            dob: true,
            sex: true,
          },
        },
      });
      if (!users) {
        return {
          users,
          message: 'OTP verified successfully',
          isVerified: true,
        };
      }

      const userClinic = await queryRunner.manager.findOne(UserClinic, {
        where: {
          user: { phoneNumber },
          clinic: { id: clinicId },
        },
      });
      if (userClinic) {
        throw new BadRequestException('User already associated with clinic');
      }
      const userDetails = await queryRunner.manager.findOne(Doctor, {
        where: {
          user: { phoneNumber },
        },
      });
      const showQualificationComponent = userDetails ? false : true;
      // TODO: - Handle case of showQualificationComponent from frontend
      return {
        users,
        message: 'OTP verified successfully',
        isVerified: true,
        showQualificationComponent,
      };
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to send SMS: ${error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        'Something Went Wrong. Please try again!',
      );
    }
  }
}
