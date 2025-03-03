import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { MetaData } from 'src/metadata/entity/metadata.entity';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { UserClinic } from 'src/user_clinic/entity/user_clinic.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  Unique,
  JoinColumn,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('users')
@Unique(['uid'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ unique: true })
  publicIdentifier: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password: string | null;

  @Column({ nullable: false, length: 10 })
  phoneNumber: string;

  @Column({ nullable: false, default: false })
  isPatient: boolean;

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

  @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.patient, {
    onDelete: 'CASCADE',
  })
  doctors: DoctorPatient[];

  @OneToMany(() => PatientClinic, (patientClinic) => patientClinic.patient, {
    onDelete: 'CASCADE',
  })
  patientClinics: PatientClinic[];

  @OneToMany(() => UserClinic, (userClinic) => userClinic.user, {
    onDelete: 'CASCADE',
  })
  userClinics: UserClinic[];

  // To track the creator of clinic can give admin access to multiple users
  @OneToMany(() => Clinic, (clinic) => clinic.createdBy, {
    onDelete: 'CASCADE',
  })
  clinics: Clinic[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeFields() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
      if (this.email === '') {
        this.email = null;
      }
    }

    if (this.name) {
      const parts = this.name.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        // Capitalize each word
        this.name = parts
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' ');
      }
    }
  }

  @BeforeInsert()
  generatePublicIdentifier() {
    // Remove non-alphabet characters and extract the first word of the name
    const firstName = this.name
      .replace(/[^A-Za-z\s]/g, '')
      .trim()
      .split(' ')[0];
    let prefix = firstName.toUpperCase().slice(0, 4);
    if (prefix.length < 4) {
      prefix += this.generateRandomLetters(4 - prefix.length);
    }
    const digitPart = this.generateRandomDigits(10);
    this.publicIdentifier = `${prefix}${digitPart}`;
  }

  private generateRandomLetters(length: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  }

  private generateRandomDigits(length: number): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }
}
