import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entity/appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { User } from '../user/entity/user.enitiy';
import { Prescription } from '../prescription/entity/prescription.entity';
import { Clinic } from '../clininc/entity/clininc.entity';
import { DoctorPatient } from '../doctor_patient/entity/doctor_patient.entity';
import { Doctor } from '../doctor/entity/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, Prescription, Clinic, DoctorPatient, Doctor]), Appointment],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
