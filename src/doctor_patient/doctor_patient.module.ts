import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';
import { Doctor } from '../doctor/entity/doctor.entity';
import { User } from '../user/entity/user.enitiy';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorPatient, Doctor, User]), // Registers entities for the module
  ],
})
export class DoctorPatientModule {}
