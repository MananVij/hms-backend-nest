import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorClinic } from '../doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from '../doctor_patient/entity/doctor_patient.entity';
import { User } from '../user/entity/user.enitiy';
import { Doctor } from '../doctor/entity/doctor.entity';
import { Appointment } from '../appointment/entity/appointment.entity';
import { Prescription } from '../prescription/entity/prescription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorClinic, DoctorPatient, User, Doctor, Appointment, Prescription]),
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
