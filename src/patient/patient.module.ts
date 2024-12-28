import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { MetadataModule } from 'src/metadata/metadata.module';
import { UserModule } from 'src/user/user.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { PatientClinicModule } from 'src/patient_clinic/patient_clinic.module';
import { DoctorPatientModule } from 'src/doctor_patient/doctor_patient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorClinic,
      DoctorPatient,
      Appointment,
      Prescription,
      MetaData,
    ]),
    MetadataModule,
    UserModule,
    ErrorLogModule,
    PatientClinicModule,
    DoctorPatientModule
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}