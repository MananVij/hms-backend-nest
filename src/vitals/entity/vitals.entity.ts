import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from 'src/user/entity/user.enitiy';
import { Appointment } from 'src/appointment/entity/appointment.entity';

@Entity('vitals')
export class Vitals {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @OneToOne(() => Appointment, (appointment) => appointment.vitals, {
    nullable: true,
  })
  appointment: Appointment;

  @Column('jsonb', { nullable: true })
  bp?: {
    systolic: number;
    diastolic: number;
  };

  @Column({ type: 'float', nullable: true })
  weight?: number;

  @Column({ type: 'int', nullable: true })
  pulse?: number;

  @Column({ type: 'float', nullable: true })
  temp?: number;

  @Column({ type: 'float', nullable: true })
  oxy?: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  patiet: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) 
  createdBy : User; 

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
