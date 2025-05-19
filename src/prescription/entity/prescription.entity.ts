import { Appointment } from 'src/appointment/entity/appointment.entity';
import { User } from 'src/user/entity/user.enitiy';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  doctor: User; // Reference to Doctor's User ID

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  patient: User; // Reference to Patient's User ID

  @Column({ nullable: true })
  diagnosis: string;

  // stores both image & voice rx data
  @Column({ nullable: true })
  audio_url?: string;

  @Column({ nullable: true })
  pres_url?: string;

  @CreateDateColumn({ nullable: true })
  edited_pres_url: string;

  @Column('jsonb', { nullable: true })
  test_suggested?: string[];

  @Column('jsonb', { nullable: true })
  test_results?: string[];

  @Column({ nullable: true })
  medical_notes?: string;

  @Column({ nullable: true })
  history?: string;

  @Column('jsonb', { nullable: true })
  medication?: {
    medicine_name: string;
    days: number;
    is_sos: boolean;
    as_directed: boolean;
    directed_comments?: string;
    food?: {
      before_breakfast: boolean;
      after_breakfast: boolean;
      after_lunch: boolean;
      after_dinner: boolean;
    };
    tapering?: {
      frequency: string;
      days: number;
      comments: string
    }[] | null,

    frequency?: {
      od: boolean; // Once daily
      bid: boolean; // Twice daily
      tid: boolean; // Three times daily
      qid: boolean; // Four times daily
      hs: boolean; // At bedtime
      ac: boolean; // Before meals
      pc: boolean; // After meals
      qam: boolean; // Every morning
      qpm: boolean; // Every evening
      bs: boolean; // Before sleep
      q6h: boolean; // Every 6 hours
      q8h: boolean; // Every 8 hours
      q12h: boolean; // Every 12 hours
      qod: boolean; // Every other day
      q1w: boolean; // Once a week
      q2w: boolean; // Twice a week
      q3w: boolean; // Thrice a week
      q1m: boolean; // Once a month
    };
    is_chip_selected: boolean;
    is_name_manually_edited: boolean;
  }[];

  @OneToOne(() => Appointment, (appointment) => appointment.prescription, {
    nullable: true,
  })
  appointment: Appointment;

  @Column({ type: 'boolean', default: true })
  is_gemini_data: boolean;

  @Column({ type: 'boolean', default: false })
  is_handwritten_rx: boolean;

  @Column({ type: 'boolean', default: false })
  is_voice_rx: boolean;

  @Column({ type: 'boolean', default: false })
  is_edited: boolean;

  @Column({ type: 'boolean', default: false })
  is_pres_edited: boolean;

  @Column({ type: 'boolean', default: false })
  is_final_prescription: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date; // Timestamp for when the object is created

  @CreateDateColumn({ type: 'timestamptz', nullable: true })
  edited_at: Date | null;

  @Column({ type: 'float', nullable: true })
  time_seconds?: number;

  @Column({ nullable: true })
  chief_complaints?: string;
}
