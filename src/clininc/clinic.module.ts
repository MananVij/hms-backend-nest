import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entity/clininc.entity';
import { ClinicController } from './clininc.controller';
import { ClinicService } from './clinic.service';
import { User } from '../user/entity/user.enitiy';
import { Doctor } from '../doctor/entity/doctor.entity';
import { DoctorClinic } from '../doctor_clinic/entity/doctor_clinic.entity';
import { Appointment } from '../appointment/entity/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic, User, Doctor, DoctorClinic, Appointment]), Clinic],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
