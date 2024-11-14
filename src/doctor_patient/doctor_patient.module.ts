import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { User } from 'src/user/entity/user.enitiy';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorPatient, Doctor, User]), // Registers entities for the module
  ],
})
export class DoctorPatientModule {}
