import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_chief_complaints')
export class AIChiefComplaint {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'chief_complaint', length: 255 })
  chiefComplaint: string;

  @Column({ type: 'json', name: 'mapped_diagnoses' })
  mappedDiagnoses: string[];

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