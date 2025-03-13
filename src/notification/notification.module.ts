import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationScheduler } from './notification.scheduler';
import { Notification } from './notification.entity';
import { HttpModule } from '@nestjs/axios';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    HttpModule,
    WhatsappModule,
    ErrorLogModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationScheduler],
  exports: [NotificationService],
})
export class NotificationModule {}
