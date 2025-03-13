import { IsBoolean, IsDateString, IsString } from 'class-validator';

export class UpdateNotificationDto {
  @IsString()
  notificationId: string;

  @IsDateString()
  timeSent: Date;

  @IsBoolean()
  isSent: boolean;
}
