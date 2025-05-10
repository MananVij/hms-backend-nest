import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientClinic } from './entity/patient_clinic.entity';
import { PatientClinicService } from './patient_clinic.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { Appointment } from 'src/appointment/entity/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientClinic, Appointment]), ErrorLogModule],
  providers: [PatientClinicService],
  exports: [PatientClinicService],
})
export class PatientClinicModule {}
