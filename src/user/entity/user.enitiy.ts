import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Contact } from 'src/contact/entity/contact.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { MetaData } from 'src/metadata/entity/metadata.entity';
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
  role: UserRole[];

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password: string | null;

  @Column({ nullable: false, unique: true })
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

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];

  @OneToOne(() => MetaData, (metaData) => metaData.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  metaData: MetaData;

  @OneToOne(() => Contact, (contact) => contact.user)
  @JoinColumn({ name: 'primary_contact' })
  contact: Contact;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor: Doctor;

  @OneToMany(() => Clinic, (clinic) => clinic.admin)
  clinics: Clinic[];

  @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.patient)
  doctors: DoctorPatient[];

  @CreateDateColumn()
  created_at: Date;
}
