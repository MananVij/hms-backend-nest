import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Vitals } from 'src/vitals/entity/vitals.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

export enum PaymnetMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

enum StatusType {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

enum VisitType {
  INITIAL_CONSULTATION = 'Initial Consultation',
  FOLLOW_UP = 'Follow Up',
  CONSULTATION = 'Consultation',
  REGULAR_CHECKUP = 'Regular Checkup',
  EMERGENCY = 'Emergency',
  SPECIALIST_REFERRAL = 'Referral',
  VIRTUAL_CONSULTATION = 'Virtual Consultation',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: number; // Unique identifier for the appointment

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor' })
  doctor: User; // Reference to the Doctor's User ID

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient' })
  patient: User; // Reference to the Patient's User ID

  @Column({ type: 'timestamptz', nullable: false })
  time: Date; // Appointment date and time

  @Column({ nullable: true })
  startTime: Date; // Appointment date and time

  @Column({
    type: 'enum',
    enum: VisitType,
    default: VisitType.INITIAL_CONSULTATION,
  })
  visitType: VisitType;

  @Column({ default: false })
  isPaid: boolean; // Indicates if the appointment has been paid for

  @Column({ type: 'enum', enum: StatusType, default: StatusType.PENDING })
  status: StatusType;

  @Column({ type: 'enum', enum: PaymnetMode })
  paymentMode: PaymnetMode;

  @Column({ default: false })
  hasVisited: boolean; // Indicates if the patient has visited the clinic

  @Column({ nullable: true })
  notes: string;

  @OneToOne(() => Prescription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'prescription' })
  prescription: Prescription; // Reference to the associated prescription (optional)

  @OneToOne(() => Vitals, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vitals' })
  vitals: Vitals; // Reference to the associated prescription (optional)

  // Added one-to-one relationship with Clinic
  @ManyToOne(() => Clinic, { nullable: false }) // Relationship to Clinic
  @JoinColumn({ name: 'clinic_id' }) // Foreign key reference
  clinic: Clinic; // Reference to the Clinic entity

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
