import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VariableDto } from './variable.dto';
import { ReportSubType, ReportType } from './report-template.enum';

@Entity('report_template')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportSubType })
  subtype: ReportSubType;

  @Column({ type: 'text' })
  content: string;

  @Column('json', { nullable: true })
  variables: VariableDto[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
