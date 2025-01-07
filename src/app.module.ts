import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'; // Import necessary parts for middleware
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrescriptionModule } from './prescription/presciption.module';
import { User } from './user/entity/user.enitiy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './prescription/entity/prescription.entity';
import { MetaData } from './metadata/entity/metadata.entity';
import { MetadataModule } from './metadata/metadata.module';
import { Clinic } from './clininc/entity/clininc.entity';
import { Doctor } from './doctor/entity/doctor.entity';
import { Appointment } from './appointment/entity/appointment.entity';
import { DoctorModule } from './doctor/doctor.module';
import { SideBar } from './sidebar/entity/sidebar.entity';
import { SidebarModule } from './sidebar/sidebar.module';
import { ClinicModule } from './clininc/clinic.module';
import { AuthModule } from './auth/auth.module';
import { DoctorClinicModule } from './doctor_clinic/doctor_clinic.module';
import { DoctorClinic } from './doctor_clinic/entity/doctor_clinic.entity';
import { Vitals } from './vitals/entity/vitals.entity';
import { VitalsModule } from './vitals/vitals.module';
import { FirebaseModule } from './firebase/firebase.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ComprehendPrescriptionModule } from './comprehend/comprehend-prescription.module';
import { DoctorPatient } from './doctor_patient/entity/doctor_patient.entity';
import { DoctorPatientModule } from './doctor_patient/doctor_patient.module';
import { PatientModule } from './patient/patient.module';
import { ErrorLog } from './errorlog/error-log.entity';
import { ErrorLogModule } from './errorlog/error-log.module';
import { PatientClinicModule } from './patient_clinic/patient_clinic.module';
import { PatientClinic } from './patient_clinic/entity/patient_clinic.entity';
import { OtpModule } from './otp/otp.module';
import { APP_INTERCEPTOR } from '@nestjs/core'; // Import APP_INTERCEPTOR from NestJS core
import { TransactionInterceptor } from './transactions/transaction.interceptor';
import { BackupService } from './backup/backup.service';
import { ScheduleModule } from '@nestjs/schedule';
import { IpLocationMiddleware } from './middleware/ip_location.middleware'; // Import the IpLocationMiddleware

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST_URL,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      username: process.env.DB_USER_NAME,
      password: process.env.DB_PASSWORD,
      entities: [
        User,
        Doctor,
        Prescription,
        MetaData,
        Appointment,
        SideBar,
        Clinic,
        DoctorClinic,
        PatientClinic,
        Vitals,
        DoctorPatient,
        ErrorLog,
      ],
      migrations: [__dirname + '/migrations/*{.ts,.js}'], // Explicit migrations
      migrationsRun: false,
      synchronize: false,
      logging: ['error', 'query', 'schema'], // Log schema operations for monitoring
      extra: {
        options: '-c timezone=UTC',
      },
    }),
    UserModule,
    DoctorModule,
    PrescriptionModule,
    MetadataModule,
    AppointmentModule,
    SidebarModule,
    ClinicModule,
    AuthModule,
    DoctorClinicModule,
    PatientClinicModule,
    VitalsModule,
    DashboardModule,
    ComprehendPrescriptionModule,
    FirebaseModule,
    DoctorPatientModule,
    PatientModule,
    ErrorLogModule,
    OtpModule,
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
