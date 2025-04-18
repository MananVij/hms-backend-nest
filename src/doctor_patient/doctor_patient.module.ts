import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient } from './entity/doctor_patient.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { User } from 'src/user/entity/user.enitiy';
import { DoctorPatientService } from './doctor_patient.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorPatient, Doctor, User]),
    ErrorLogModule,
  ],
  providers: [DoctorPatientService],
  exports: [DoctorPatientService],
})
export class DoctorPatientModule {}
