import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../user/entity/user.enitiy';
import { Doctor } from '../doctor/entity/doctor.entity';
import { DoctorClinic } from '../doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from '../doctor_patient/entity/doctor_patient.entity';
import { MetaData } from '../metadata/entity/metadata.entity';
import { Appointment } from '../appointment/entity/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Doctor, DoctorClinic, DoctorPatient, MetaData, Appointment])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
