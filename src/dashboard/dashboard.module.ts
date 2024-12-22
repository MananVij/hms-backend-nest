import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Doctor, DoctorClinic, DoctorPatient, MetaData, Appointment, Clinic])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
