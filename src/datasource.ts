import { DataSourceOptions } from 'typeorm';
import { Doctor } from './doctor/entity/doctor.entity';
import { Prescription } from './prescription/entity/prescription.entity';
import { MetaData } from './metadata/entity/metadata.entity';
import { Appointment } from './appointment/entity/appointment.entity';
import { SideBar } from './sidebar/entity/sidebar.entity';
import { Clinic } from './clininc/entity/clininc.entity';
import { UserClinic } from './user_clinic/entity/user_clinic.entity';
import { PatientClinic } from './patient_clinic/entity/patient_clinic.entity';
import { Vitals } from './vitals/entity/vitals.entity';
import { DoctorPatient } from './doctor_patient/entity/doctor_patient.entity';
import { ErrorLog } from './errorlog/error-log.entity';
import { User } from './user/entity/user.enitiy';
import { ReportAccess } from './report-access/entity/report-access.entity';
import { MedicalReport } from './medical-reports/entity/medical-reports.entity';
import { Notification } from './notification/notification.entity';
import { Report } from './report/report.entity';
import { ReportTemplate } from './report_template/report-template.entity';
import { Medicine } from './medicine/entity/medicine.entity';
import { FavoriteMedicine } from './favourite-medicines/entity/favorite-medicine.entity';
import { PrescriptionTemplate } from './prescription-template/entity/prescription-template.entity';
import { NormalizedPrescription } from './medicine-recommendation-ai-service/entity/normalized-prescription.entity';
import { AIChiefComplaint } from './medicine-recommendation-ai-service/entity/ai-chief-complaint.entity';
import { AIMedicineDiagnosis } from './medicine-recommendation-ai-service/entity/ai-medicine-diagnosis.entity';
import { AIDiagnosisNotes } from './medicine-recommendation-ai-service/entity/ai-diagnosis-notes.entity';

export const AppDataSourceConfig: DataSourceOptions = {
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
    UserClinic,
    PatientClinic,
    Vitals,
    DoctorPatient,
    ErrorLog,
    MedicalReport,
    ReportAccess,
    Notification,
    Report,
    ReportTemplate,
    Medicine,
    FavoriteMedicine,
    PrescriptionTemplate,
    NormalizedPrescription,
    AIChiefComplaint,
    AIMedicineDiagnosis,
    AIDiagnosisNotes
  ],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  synchronize: false,
  logging: ['error', 'query', 'schema'],
  extra: {
    options: '-c timezone=UTC',
  },
};
