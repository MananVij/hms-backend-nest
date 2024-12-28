import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from './entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { DoctorClinicModule } from 'src/doctor_clinic/doctor_clinic.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { ClinicService } from 'src/clininc/clinic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Clinic, DoctorPatient]),
    Doctor,
    DoctorClinicModule,
    MetadataModule,
    UserModule,
  ],
  controllers: [DoctorController],
  providers: [DoctorService, ClinicService],
  exports: [DoctorService],
})
export class DoctorModule {}
