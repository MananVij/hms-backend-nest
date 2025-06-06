import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_medicine_diagnoses')
@Index('idx_medicine_diagnoses', ['medicineName'])
@Index('idx_diagnosis_medicine', ['diagnoses'])
export class AIMedicineDiagnosis {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'medicine_name', length: 255 })
  medicineName: string;

  @Column({ type: 'json', name: 'diagnoses' })
  diagnoses: string[];

  @Column({ name: 'specialty', length: 100 })
  specialty: string;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  confidenceScore: number;

  @Column({ name: 'training_eligible', default: true })
  trainingEligible: boolean;

  @Column({ name: 'prescription_frequency', default: 1 })
  prescriptionFrequency: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 