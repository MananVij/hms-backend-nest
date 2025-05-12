import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { AuthModule } from '../auth/auth.module';
import { ReportTemplate } from 'src/report_template/report-template.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Clinic } from 'src/clininc/entity/clininc.entity';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { Report } from './report.entity';
import { User } from 'src/user/entity/user.enitiy';
import { FirebaseService } from 'src/firebase/firebase.service';
import { ErrorLogService } from 'src/errorlog/error-log.service';
import { ErrorLogModule } from 'src/errorlog/error-log.module';
import { ErrorLog } from 'src/errorlog/error-log.entity';
import { UserClinic } from 'src/user_clinic/entity/user_clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      ReportTemplate,
      Doctor,
      Clinic,
      PatientClinic,
      User,
      ErrorLog,
      UserClinic
    ]),
    AuthModule,
    ErrorLogModule
  ],
  controllers: [ReportController],
  providers: [ReportService, FirebaseService, ErrorLogService],
})
export class ReportModule {}
