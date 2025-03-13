import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entity/appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { User } from 'src/user/entity/user.enitiy';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { UserService } from 'src/user/user.service';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Prescription, User]),
    Appointment,
    ErrorLogModule,
    UserClinicModule,
    NotificationModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService, UserService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
