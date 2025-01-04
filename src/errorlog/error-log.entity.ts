import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('error_logs')
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  error_message: string;

  @Column({ type: 'text', nullable: true })
  stack_trace: string;

  @Column({ type: 'text', nullable: true })
  audio_url: string;

  @Column({ type: 'text', nullable: true })
  doctor: string;

  @Column({ type: 'text', nullable: true })
  patient: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
