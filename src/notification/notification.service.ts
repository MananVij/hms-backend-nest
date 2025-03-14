import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Between, QueryRunner } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationSubTypeEnum,
  NotificationTypeEnum,
} from './notification.enum';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class NotificationService {
  constructor(private readonly errorLogService: ErrorLogService) {}

  async createNotification(
    queryRunner: QueryRunner,
    data: CreateNotificationDto,
  ) {
    try {
      const appointmentId = data.appointmentId;
      const appointment = await queryRunner.manager.findOne(Appointment, {
        where: { id: appointmentId },
      });
      if (!appointment) {
        throw new InternalServerErrorException('Appointment not found. ');
      }
      const notification = queryRunner.manager.create(Notification, {
        ...data,
        appointment,
      });
      return await queryRunner.manager.save(notification);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Error in creating notification: ${error?.message}`,
        error?.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException('Unable to create notifications.');
    }
  }

  async updateNotificationStatus(
    queryRunner: QueryRunner,
    id: string,
    data: UpdateNotificationDto,
  ) {
    return await queryRunner.manager.update(Notification, id, data);
  }

  async getPendingScheduledNotifications(
    queryRunner: QueryRunner,
    targetDate: Date,
  ) {
    try {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      return queryRunner.manager.find(Notification, {
        where: {
          isSent: false,
          type: NotificationTypeEnum.WHATSAPP,
          subType: NotificationSubTypeEnum.REMINDER,
          appointment: {
            followUp: Between(startOfDay, endOfDay),
          },
        },
        relations: ['appointment', 'appointment.patient', 'appointment.doctor', 'appointment.clinic'],
      });
    } catch (error) {
      await this.errorLogService.logError(
        `Error in finding scheduled notifications: ${error?.message}`,
        error?.stack,
        null,
        null,
        null,
      );
      throw new InternalServerErrorException(
        'Unable to find scheduled notifications.',
      );
    }
  }
}
