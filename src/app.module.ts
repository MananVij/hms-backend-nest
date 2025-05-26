import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrescriptionModule } from './prescription/presciption.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataModule } from './metadata/metadata.module';
import { DoctorModule } from './doctor/doctor.module';
import { SidebarModule } from './sidebar/sidebar.module';
import { ClinicModule } from './clininc/clinic.module';
import { AuthModule } from './auth/auth.module';
import { UserClinicModule } from './user_clinic/user_clinic.module';
import { VitalsModule } from './vitals/vitals.module';
import { FirebaseModule } from './firebase/firebase.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ComprehendPrescriptionModule } from './comprehend/comprehend-prescription.module';
import { DoctorPatientModule } from './doctor_patient/doctor_patient.module';
import { PatientModule } from './patient/patient.module';
import { ErrorLogModule } from './errorlog/error-log.module';
import { PatientClinicModule } from './patient_clinic/patient_clinic.module';
import { OtpModule } from './otp/otp.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionInterceptor } from './transactions/transaction.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { AppDataSourceConfig } from './datasource';
import { BackupService } from './backup/backup.service';
import { IpLocationMiddleware } from './middleware/ip_location.middleware';
import { MedicalReportModule } from './medical-reports/medical-report.module';
import { ReportAccessModule } from './report-access/report-access.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NotificationModule } from './notification/notification.module';
import { ReportModule } from './report/report.module';
import { ReportTemplateModule } from './report_template/report-template.module';
import { MedicineModule } from './medicine/medicine.module';
import { FavoriteMedicineModule } from './favourite-medicines/favorite-medicine.module';
import { PrescriptionTemplateModule } from './prescription-template/prescription-template.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(AppDataSourceConfig),
    UserModule,
    DoctorModule,
    PrescriptionModule,
    MetadataModule,
    AppointmentModule,
    SidebarModule,
    ClinicModule,
    AuthModule,
    UserClinicModule,
    PatientClinicModule,
    VitalsModule,
    DashboardModule,
    ComprehendPrescriptionModule,
    FirebaseModule,
    DoctorPatientModule,
    PatientModule,
    ErrorLogModule,
    OtpModule,
    MedicalReportModule,
    ReportAccessModule,
    WhatsappModule,
    NotificationModule,
    ReportModule,
    ReportTemplateModule,
    MedicineModule,
    FavoriteMedicineModule,
    PrescriptionTemplateModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BackupService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpLocationMiddleware).forRoutes('*');
  }
}
