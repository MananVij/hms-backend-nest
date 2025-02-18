import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { MedicalReport } from 'src/medical-reports/entity/medical-reports.entity';

@Entity('report_access')
export class ReportAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MedicalReport, (report) => report.accessGrants, { onDelete: 'CASCADE' })
  report: MedicalReport;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}