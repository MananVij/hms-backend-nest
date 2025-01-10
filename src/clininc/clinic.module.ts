import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entity/clininc.entity';
import { ClinicController } from './clininc.controller';
import { ClinicService } from './clinic.service';
import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';
import { UserClinicModule } from 'src/user_clinic/user_clinic.module';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinic, User, Appointment]),
    Clinic,
    UserClinicModule,
    ErrorLogModule,
  ],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
