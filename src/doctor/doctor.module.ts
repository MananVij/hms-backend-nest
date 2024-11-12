import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from './entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Clinic, User, DoctorPatient]), Doctor],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
