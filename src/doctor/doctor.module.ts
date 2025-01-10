import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from './entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { ClinicService } from 'src/clininc/clinic.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Clinic, DoctorPatient]),
    UserClinicModule,
    MetadataModule,
    UserModule,
    ErrorLogModule
  ],
  controllers: [DoctorController],
  providers: [DoctorService, ClinicService],
  exports: [DoctorService],
})
export class DoctorModule {}
