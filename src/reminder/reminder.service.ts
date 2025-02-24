import { Injectable } from '@nestjs/common';
import { SmsService } from 'src/sms/sms.service';

@Injectable()
export class ReminderService {
  constructor(private smsService: SmsService) {}

  async sendReminder(
    phoneNumber: string,
    reminderMessage: string,
  ): Promise<void> {
    try {
      const message = `Reminder: ${reminderMessage}`;
      await this.smsService.sendSms(phoneNumber, message);
    } catch (error) {
      throw error;
    }
  }
}
