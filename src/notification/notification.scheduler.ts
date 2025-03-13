import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { WhatsappTemplate } from 'src/whatsapp/whatsapp-template.enum';
import { DataSource } from 'typeorm';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsappService,
    private readonly errorLogService: ErrorLogService,
    private readonly dataSource: DataSource,
  ) {}

  private formatDate(date: Date): string {
    const day = date.getDate();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
  }

  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${hours}:${minutes} ${ampm}`;
  }

  @Cron('30 4 * * *')
  async handleScheduledNotifications() {
    this.logger.log('Checking for scheduled notifications...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const notifications =
      await this.notificationService.getPendingScheduledNotifications(
        queryRunner,
        tomorrow,
      );

    if (notifications.length) {
      this.logger.log(`Found ${notifications.length} pending notifications`);

      for (const notification of notifications) {
        try {
          const appointment = notification.appointment;
          const formattedScheduleDate = this.formatDate(
            notification.appointment.followUp,
          );
          const formattedScheduleTime = this.formatTime(
            notification.appointment.followUp,
          );
          const whatsappNotificationId = await this.whatsappService.sendMessage(
            appointment.patient.phoneNumber,
            WhatsappTemplate.APPOINTMENT_REMINDER,
            [
              appointment.patient.name,
              appointment.doctor.name,
              formattedScheduleDate,
              formattedScheduleTime,
              `${appointment.clinic.line1}, ${appointment.clinic.line2}`,
              appointment.clinic.contactNumber,
            ],
            appointment.clinic.name,
            null,
          );
          await this.notificationService.updateNotificationStatus(
            queryRunner,
            notification.id,
            {
              notificationId: whatsappNotificationId,
              isSent: true,
              timeSent: new Date(),
            },
          );
          await queryRunner.commitTransaction();
        } catch (error) {
          await this.errorLogService.logError(
            `Error in sending scheduled whatsapp reminder: ${error?.message}`,
            error?.stack,
            null,
            null,
            null,
          );
        }
      }
    } else {
      this.logger.log('No scheduled notifications found.');
    }
  }
}
