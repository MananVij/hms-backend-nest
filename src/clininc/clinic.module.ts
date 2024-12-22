import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entity/clininc.entity';
import { ClinicController } from './clininc.controller';
import { ClinicService } from './clinic.service';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic, User, Doctor, Appointment]), Clinic],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
