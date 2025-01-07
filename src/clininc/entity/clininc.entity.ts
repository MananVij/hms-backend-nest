import { Appointment } from 'src/appointment/entity/appointment.entity';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

@Entity('clinic')
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  line1: string;

  @Column({ nullable: true })
  line2: string;

  @Column({ nullable: false })
  pincode: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: false, length: 10 })
  contactNumber: string;

  @ManyToOne(() => User, (user) => user.clinics, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'admin_id' })
  admin: User; // Admin associated with the clinic

  @OneToMany(() => DoctorClinic, (doctorClinic) => doctorClinic.clinic, {
    onDelete: 'CASCADE',
  })
  doctorClinics: DoctorClinic[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic, {
    onDelete: 'CASCADE',
  })
  appointments: Appointment[]; // One clinic can have many appointments

  @OneToMany(() => PatientClinic, (patientClinic) => patientClinic.clinic, {
    onDelete: 'CASCADE',
  })
  patientClinics: PatientClinic[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
