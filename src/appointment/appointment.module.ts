import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entity/appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, Prescription, Clinic, DoctorPatient, Doctor]), Appointment],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
