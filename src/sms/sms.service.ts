import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class SmsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async sendSms(to: string, message: string): Promise<void> {
    if (!to || !message) {
      throw new Error('Recipient phone number and message are required.');
    }

    if (!/^\d{10}$/.test(to)) {
      throw new Error(
        'Invalid recipient phone number format. Use E.164 format (e.g., +919876543210)',
      );
    }

    const baseUrl = this.configService.get<string>('SMS_BASE_URL');
    const customerId = this.configService.get<string>('SMS_CUSTOMER_ID');
    const senderId = this.configService.get<string>('SMS_SENDER_ID');
    const authToken = this.configService.get<string>('SMS_AUTH_TOKEN');

    if (!baseUrl || !customerId || !senderId || !authToken) {
      throw new Error('Missing SMS configuration in environment variables.');
    }

    try {
      await firstValueFrom(
        this.httpService.post(baseUrl, null, {
          headers: {
            authToken: authToken,
          },
          params: {
            countryCode: '91',
            customerId: customerId,
            senderId: senderId,
            type: 'SMS',
            flowType: 'SMS',
            mobileNumber: to,
            message: message,
          },
        }),
      );
    } catch (error) {
      await this.errorLogService.logError(
        `Unable to send SMS: ${error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        'Unable to Send SMS at the moment. Please try later.',
      );
    }
  }
}
