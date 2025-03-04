import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { MetadataModule } from 'src/metadata/metadata.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { PatientClinicModule } from 'src/patient_clinic/patient_clinic.module';
import { DoctorPatientModule } from 'src/doctor_patient/doctor_patient.module';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { PublicIdentifierService } from 'src/user/public-identifier.service';
import { User } from 'src/user/entity/user.enitiy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DoctorPatient,
      Appointment,
      Prescription,
    ]),
    MetadataModule,
    ErrorLogModule,
    PatientClinicModule,
    DoctorPatientModule,
    UserClinicModule,
    AppointmentModule
  ],
  controllers: [PatientController],
  providers: [PatientService, PublicIdentifierService],
  exports: [PatientService],
})
export class PatientModule {}