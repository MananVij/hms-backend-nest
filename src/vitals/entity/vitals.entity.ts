import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Prescription } from 'src/prescription/entity/prescription.entity';
import { User } from 'src/user/entity/user.enitiy';

@Entity('vitals')
export class Vitals {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @OneToMany(() => Prescription, (prescription) => prescription.vitals, { nullable: false })
  prescription: Prescription;

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

  @ManyToOne(() => User, {nullable: false, onDelete: 'CASCADE'})
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}