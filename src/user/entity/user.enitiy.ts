import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, Unique, JoinColumn } from 'typeorm';
import { MetaData } from '../../metadata/entity/metadata.entity';
import { Contact } from '../../contact/entity/contact.entity';
import { DoctorPatient } from '../../doctor_patient/entity/doctor_patient.entity';
import { Clinic } from '../../clininc/entity/clininc.entity';
import { Doctor } from '../../doctor/entity/doctor.entity';

export enum UserRole {
  ADMIN = 'admin',
  PATIENT = 'patient',
  DOCTOR = 'doctor',
}

@Entity('users')
@Unique(['uid'])
export class  User {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: [UserRole.PATIENT],
    nullable: false,
  })
  role: UserRole[];

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  is_verified: boolean;

  @OneToMany(() => Contact, (contact) => contact.user) // One user can have many contacts
  contacts: Contact[];

  @OneToOne(() => MetaData, (metaData) => metaData.user)
  @JoinColumn({name: "metaData"})
  metaData: MetaData; // Inverse side does not store the foreign key

  @OneToOne(() => Contact, (contact) => contact.user)
  @JoinColumn({name: "contact"})
  contact: Contact; // Inverse side does not store the foreign key

  @OneToOne(() => Doctor, (doctor) => doctor.user)  // Link back to Doctor
  doctor: Doctor;

  @OneToMany(() => Clinic, (clinic) =>clinic.admin)
  clinics: Clinic[]

  @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.patient)
  doctors: DoctorPatient[];
}
