import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entity/user.enitiy';
import { Prescription } from '../../prescription/entity/prescription.entity';

export enum NormalizationMethod {
  AUTO_CORRECTED = 'AUTO_CORRECTED',
  HUMAN_REVIEWED = 'HUMAN_REVIEWED',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  BULK_IMPORT = 'BULK_IMPORT',
}

export enum ValidationStatus {
  APPROVED = 'APPROVED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED',
}

@Entity('normalized_prescriptions')
@Index('idx_medicine_specialty', ['medicineName', 'specialty'])
@Index('idx_diagnosis_medicine', ['diagnosisCode', 'medicineName'])
@Index('idx_doctor_patterns', ['doctorId', 'medicineName'])
@Index('idx_training_eligible', ['trainingEligible', 'validationStatus'])
@Index('idx_confidence_score', ['confidenceScore'])
export class NormalizedPrescription {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // Original Data Reference
  @Column({ name: 'original_prescription_id', nullable: true })
  originalPrescriptionId: number;

  @Column({ type: 'text', name: 'original_entry', nullable: true })
  originalEntry: string;

  // Normalized Medicine Data
  @Column({ name: 'medicine_name', length: 255 })
  medicineName: string;

  @Column({ name: 'medicine_code', length: 50, nullable: true })
  medicineCode: string;

  @Column({ name: 'medicine_category', length: 100, nullable: true })
  medicineCategory: string;

  @Column({ name: 'generic_name', length: 255, nullable: true })
  genericName: string;

  @Column({ type: 'json', name: 'brand_names', nullable: true })
  brandNames: string[];

  // Normalized Dosage Data
  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'dosage_amount', nullable: true })
  dosageAmount: number;

  @Column({ name: 'dosage_unit', length: 20, nullable: true })
  dosageUnit: string;

  @Column({ name: 'dosage_form', length: 50, nullable: true })
  dosageForm: string;

  // Normalized Frequency Data
  @Column({ name: 'frequency_code', length: 20, nullable: true })
  frequencyCode: string;

  @Column({ name: 'frequency_description', length: 100, nullable: true })
  frequencyDescription: string;

  @Column({ name: 'frequency_per_day', nullable: true })
  frequencyPerDay: number;

  // Normalized Duration Data
  @Column({ name: 'duration_value', nullable: true })
  durationValue: number;

  @Column({ name: 'duration_unit', length: 20, nullable: true })
  durationUnit: string;

  @Column({ name: 'duration_description', length: 100, nullable: true })
  durationDescription: string;

  // Medical Context
  @Column({ name: 'diagnosis_code', length: 20, nullable: true })
  diagnosisCode: string;

  @Column({ name: 'diagnosis_name', length: 255, nullable: true })
  diagnosisName: string;

  @Column({ name: 'specialty', length: 100, nullable: true })
  specialty: string;

  @Column({ type: 'text', name: 'chief_complaint', nullable: true })
  chiefComplaint: string;

  // Patient Context (Anonymized)
  @Column({ name: 'age_group', length: 20, nullable: true })
  ageGroup: string;

  @Column({ name: 'gender', length: 1, nullable: true })
  gender: string;

  @Column({ name: 'weight_category', length: 20, nullable: true })
  weightCategory: string;

  // Doctor Context
  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @Column({ name: 'doctor_specialization', length: 100, nullable: true })
  doctorSpecialization: string;

  @Column({ name: 'doctor_experience_years', nullable: true })
  doctorExperienceYears: number;

  // Normalization Metadata
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'confidence_score', nullable: true })
  confidenceScore: number;

  @Column({
    type: 'enum',
    enum: NormalizationMethod,
    name: 'normalization_method',
    default: NormalizationMethod.BULK_IMPORT,
  })
  normalizationMethod: NormalizationMethod;

  @Column({ type: 'json', name: 'ai_suggestions', nullable: true })
  aiSuggestions: string[];

  @Column({ name: 'human_reviewer_id', nullable: true })
  humanReviewerId: string;

  // Quality Control
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'quality_score', nullable: true })
  qualityScore: number;

  @Column({
    type: 'enum',
    enum: ValidationStatus,
    name: 'validation_status',
    default: ValidationStatus.APPROVED,
  })
  validationStatus: ValidationStatus;

  @Column({ name: 'training_eligible', default: true })
  trainingEligible: boolean;

  // Clinical Validation
  @Column({ name: 'drug_interactions_checked', default: false })
  drugInteractionsChecked: boolean;

  @Column({ name: 'allergy_conflicts_checked', default: false })
  allergyConflictsChecked: boolean;

  @Column({ name: 'dosage_validated', default: false })
  dosageValidated: boolean;

  // Medical Notes
  @Column({ type: 'text', name: 'medical_notes', nullable: true })
  medicalNotes: string;

  // Relationships
  @ManyToOne(() => Prescription, { nullable: true })
  @JoinColumn({ name: 'original_prescription_id' })
  originalPrescription: Prescription;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctor_id', referencedColumnName: 'uid' })
  doctor: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'human_reviewer_id', referencedColumnName: 'uid' })
  humanReviewer: User;

  // Audit Fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
} 