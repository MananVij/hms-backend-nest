import { Controller, Post, Body, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    try {
      return this.notificationService.createNotification(
        queryRunner,
        createNotificationDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch()
  async update(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Body() id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    try {
      return this.notificationService.updateNotificationStatus(
        queryRunner,
        id,
        updateNotificationDto,
      );
    } catch (error) {
      throw error;
    }
  }
}
