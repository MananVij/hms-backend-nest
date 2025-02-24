import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ReminderService } from './reminder.service';

@Controller('reminder')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendReminder(
    @Body('phoneNumber') phoneNumber: string,
    @Body('message') message: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.reminderService.sendReminder(phoneNumber, message);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}
