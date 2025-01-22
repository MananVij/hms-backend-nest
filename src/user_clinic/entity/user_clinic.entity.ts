import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  PATIENT = 'patient',
  NURSE = 'nurse',
  DOCTOR = 'doctor',
  RECEPTIONIST = 'receptionist',
}

@Entity('user_clinic')
export class UserClinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userClinics, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    nullable: false,
  })
  role: UserRole[];

  @ManyToOne(() => Clinic, (clinic) => clinic.userClinic, {
    onDelete: 'CASCADE',
  })
  clinic: Clinic;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
