import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { UserClinic } from 'src/user_clinic/entity/user_clinic.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { AppointmentService } from 'src/appointment/appointment.service';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Doctor, UserClinic, DoctorPatient, MetaData, Clinic, Appointment, UserClinic, PatientClinic]), AppointmentModule, UserClinicModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
