import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_diagnosis_notes')
@Index('idx_diagnosis_notes', ['diagnosis'])
export class AIDiagnosisNotes {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'diagnosis', length: 255 })
  diagnosis: string;

  @Column({ type: 'text', name: 'medical_notes' })
  medicalNotes: string;

  @Column({ name: 'specialty', length: 100 })
  specialty: string;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  confidenceScore: number;

  @Column({ name: 'training_eligible', default: true })
  trainingEligible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 