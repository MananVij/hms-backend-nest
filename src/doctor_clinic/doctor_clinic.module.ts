import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorClinic } from './entity/doctor_clinic.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { DoctorClinicController } from './doctor-clinic.controller';
import { DoctorClinicService } from './doctor-clinic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorClinic, Doctor, Clinic]),
  ],
  controllers: [DoctorClinicController],
  providers: [DoctorClinicService],
  exports: [DoctorClinicService],
})
export class DoctorClinicModule {}
