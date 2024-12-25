import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { MetaDataService } from 'src/metadata/meta-data.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { PatientClinicModule } from 'src/patient_clinic/patient_clinic.module';
import { DoctorPatientService } from 'src/doctor_patient/doctor_patient.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorClinic,
      DoctorPatient,
      User,
      Doctor,
      Appointment,
      Prescription,
      MetaData,
    ]),
    ErrorLogModule,
    PatientClinicModule,
  ],
  controllers: [PatientController],
  providers: [PatientService, MetaDataService, DoctorPatientService],
  exports: [PatientService],
})
export class PatientModule {}
