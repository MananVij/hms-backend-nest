import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Doctor } from '../../doctor/entity/doctor.entity';

@Entity('prescription_template')
export class PrescriptionTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'jsonb' })
  data: {
    diagnosis: string;
    history: string;
    test_suggested: string[];
    test_results: string[];
    medical_notes: string;
    is_gemini_data?: boolean;
    is_handwritten_rx?: boolean;
    is_voice_rx?: boolean;
    medication: {
      medicine_name: string;
      dosage: string;
      tapering: any[];
      days: string;
      is_sos: boolean;
      as_directed: boolean;
      directed_comments: string;
      is_chip_selected?: boolean;
      is_name_manually_edited?: boolean;
      food?: {
        before_breakfast: boolean;
        after_breakfast: boolean;
        after_lunch: boolean;
        after_dinner: boolean;
      };
      frequency?: {
        od: boolean;
        bid: boolean;
        tid: boolean;
        qid: boolean;
        hs: boolean;
        ac: boolean;
        pc: boolean;
        qam: boolean;
        qpm: boolean;
        bs: boolean;
        q6h: boolean;
        q8h: boolean;
        q12h: boolean;
        qod: boolean;
        q1w: boolean;
        q2w: boolean;
        q3w: boolean;
        q1m: boolean;
      };
    }[];
  };

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}



