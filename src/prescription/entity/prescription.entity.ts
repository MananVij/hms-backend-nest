import { User } from 'src/user/entity/user.enitiy';
import { Vitals } from 'src/vitals/entity/vitals.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => User, { nullable: false })
  doctor: User; // Reference to Doctor's User ID

  @ManyToOne(() => User, { nullable: false })
  patient: User; // Reference to Patient's User ID

  @Column()
  diagnosis: string;

  @Column({ nullable: true })
  audio_url?: string;

  @Column({ nullable: true })
  pres_url?: string;

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
    food?: {
      before_breakfast: boolean;
      after_breakfast: boolean;
      after_lunch: boolean;
      after_dinner: boolean;
    };
    frequency?: {
      od: boolean; // Once daily
      bid: boolean; // Twice daily
      tid: boolean; // Three times daily
      qid: boolean; // Four times daily
      hs: boolean; // At bedtime
      ac: boolean; // Before meals
      pc: boolean; // After meals
    };
  }[];

  @ManyToOne(() => Vitals, (vitals) => vitals.prescription, { nullable: true })
  @JoinColumn({ name: 'vitals_id' })
  vitals?: Vitals;

  @Column({ type: 'boolean', default: true })
  is_gemini_data: boolean;

  @CreateDateColumn()
  created_at: Date; // Timestamp for when the object is created
}
