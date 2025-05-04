import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { ReportTemplate } from 'src/report_template/report-template.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity('report')

export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ReportTemplate, { eager: true })
  template: ReportTemplate;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @Column({ type: 'jsonb' })
  values: Record<string, string | null>;

  @ManyToOne(() => Doctor, { eager: true, nullable: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Clinic, { eager: true, nullable: false })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ nullable: false })
  pdfUrl: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
