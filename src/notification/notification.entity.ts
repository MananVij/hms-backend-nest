import { Appointment } from 'src/appointment/entity/appointment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import {
  NotificationSubTypeEnum,
  NotificationTypeEnum,
} from './notification.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  notificationId: string;

  @Column({
    type: 'enum',
    enum: NotificationTypeEnum,
  })
  type: NotificationTypeEnum;

  @Column({
    type: 'enum',
    enum: NotificationSubTypeEnum,
  })
  subType: NotificationSubTypeEnum;

  @CreateDateColumn()
  timeSent: Date;

  @Column({ type: 'boolean', default: false })
  isSent: boolean;

  @ManyToOne(() => Appointment, (appointment) => appointment.notifications, {
    nullable: true,
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
