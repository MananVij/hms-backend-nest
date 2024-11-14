import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorClinic } from './entity/doctor_clinic.entity';
import { DoctorClinicController } from './doctor-clinic.controller';
import { DoctorClinicService } from './doctor-clinic.service';
import { Doctor } from '../doctor/entity/doctor.entity';
import { Clinic } from '../clininc/entity/clininc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorClinic, Doctor, Clinic]),
  ],
  controllers: [DoctorClinicController],
  providers: [DoctorClinicService],
  exports: [DoctorClinicService],
})
export class DoctorClinicModule {}
