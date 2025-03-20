import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsString,
} from 'class-validator';
import {
  NotificationSubTypeEnum,
  NotificationTypeEnum,
} from '../notification.enum';

export class CreateNotificationDto {
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @IsEnum(NotificationSubTypeEnum)
  subType: NotificationSubTypeEnum;

  @IsString()
  @IsOptional()
  notificationId?: string;

  @IsDateString()
  @IsOptional()
  timeSent?: Date;

  @IsBoolean()
  @IsOptional()
  isSent?: boolean;

  @IsUUID()
  @IsOptional()
  appointmentId?: number;
}
