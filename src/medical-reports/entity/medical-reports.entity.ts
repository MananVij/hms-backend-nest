import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ReportAccess } from 'src/report-access/entity/report-access.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

// record-type.enum.ts
export enum RecordTypeEnum {
  MRI = 'MRI',
  XRAY = 'XRAY',
  LAB_REPORT = 'LAB_REPORT',
  PRESCRIPTION = 'PRESCRIPTION',
  MEDICAL_IMAGE = 'MEDICAL_IMAGE',
  OTHER = 'OTHER',
}


@Entity('medical_reports')
export class MedicalReport {
  @PrimaryGeneratedColumn('uuid')
  reportId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctorId' })
  doctor?: Doctor;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  fileUrl: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User;

  @Column({ type: 'enum', enum: RecordTypeEnum })
  recordType: RecordTypeEnum;

  @OneToMany(() => ReportAccess, (access) => access.report)
  accessGrants: ReportAccess[];
}

