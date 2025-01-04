import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  Unique,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  PATIENT = 'patient',
  NURSE = 'nurse',
  DOCTOR = 'doctor',
}

@Entity('users')
@Unique(['uid'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
    nullable: false,
  })
  role: UserRole;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password: string | null;

  @Column({ nullable: false, unique: true, length: 10 })
  phoneNumber: string;

  @Column({ default: false, nullable: false })
  hasOnboardedClinic: boolean;

  @Column('json', { nullable: true })
  address: {
    line1: string;
    line2?: string;
    pincode: string;
  };

  @Column({ default: false })
  is_verified: boolean;

  @OneToOne(() => MetaData, (metaData) => metaData.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  metaData: MetaData;

  @OneToOne(() => Doctor, (doctor) => doctor.user, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @OneToMany(() => Clinic, (clinic) => clinic.admin, { onDelete: 'CASCADE' })
  clinics: Clinic[];

  @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.patient, {
    onDelete: 'CASCADE',
  })
  doctors: DoctorPatient[];

  @OneToMany(() => PatientClinic, (patientClinic) => patientClinic.patient, {
    onDelete: 'CASCADE',
  })
  patientClinics: PatientClinic[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
