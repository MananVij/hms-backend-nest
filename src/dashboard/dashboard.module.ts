import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Doctor,
      DoctorPatient,
      MetaData,
      Appointment,
      PatientClinic,
    ]),
    AppointmentModule,
    UserClinicModule,
    ErrorLogModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
