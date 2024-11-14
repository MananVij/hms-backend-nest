import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from './entity/doctor.entity';
import { Clinic } from '../clininc/entity/clininc.entity';
import { User } from '../user/entity/user.enitiy';
import { DoctorPatient } from '../doctor_patient/entity/doctor_patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Clinic, User, DoctorPatient]), Doctor],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
