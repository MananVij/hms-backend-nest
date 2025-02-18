import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalReportController } from './medical-report.controller';
import { MedicalReportService } from './medical-report.service';
import { ErrorLogModule } from '../errorlog/error-log.module';
import { MedicalReport } from './entity/medical-reports.entity';
import { ReportAccess } from 'src/report-access/entity/report-access.entity';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalReport, ReportAccess]),
    ErrorLogModule,
  ],
  controllers: [MedicalReportController],
  providers: [MedicalReportService, FirebaseService],
  exports: [MedicalReportService]
})
export class MedicalReportModule {}