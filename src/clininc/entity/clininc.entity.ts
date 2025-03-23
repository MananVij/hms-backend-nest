import { Appointment } from 'src/appointment/entity/appointment.entity';
import { UserClinic } from 'src/user_clinic/entity/user_clinic.entity';
import { PatientClinic } from 'src/patient_clinic/entity/patient_clinic.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entity/user.enitiy';

@Entity('clinic')
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.clinics, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

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

  @Column({ type: 'boolean', nullable: false, default: false })
  isSubscriptionActive: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  isWhatsappEnabled: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  isTrialPeriodActive: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  isTrialUsed: boolean;

  @Column({ type: 'date', nullable: false, default: () => 'CURRENT_DATE' }) // defualt as todays date
  subscriptionStartDate: Date;

  @Column({ type: 'date', nullable: false, default: () => 'CURRENT_DATE' }) // defualt as todays date
  subscriptionEndDate: Date;

  @OneToMany(() => UserClinic, (userClinic) => userClinic.clinic, {
    onDelete: 'CASCADE',
  })
  userClinic: UserClinic[];

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
