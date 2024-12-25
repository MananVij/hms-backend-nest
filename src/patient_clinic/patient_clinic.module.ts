import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientClinic } from './entity/patient_clinic.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { PatientClinicService } from './patient_clinic.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([PatientClinic, User, Clinic]), ErrorLogModule],
  providers: [PatientClinicService],
  exports: [PatientClinicService]
})
export class PatientClinicModule {}
