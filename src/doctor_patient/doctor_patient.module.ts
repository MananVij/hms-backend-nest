import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorPatientService } from './doctor_patient.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorPatient, Doctor, User]), // Registers entities for the module
  ],
  providers: [DoctorPatientService],
  exports: [DoctorPatientService],
})
export class DoctorPatientModule {}
