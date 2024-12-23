import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from './entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { DoctorClinicModule } from 'src/doctor_clinic/doctor_clinic.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Clinic, User, DoctorPatient]), Doctor, DoctorClinicModule, MetadataModule, UserModule],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
