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

export enum FooterType {
  IMAGE = 'image',
  TEXT = 'text',
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

  @Column({ default: true })
  usesOwnLetterPad: boolean;

  @Column({
    type: 'json',
    nullable: true,
  })
  padding: {
    paddingTop: number | null;
    paddingLeft: number | null;
    paddingBottom: number | null;
    paddingRight: number | null;
  };
  @Column({ type: 'text', nullable: true })
  footerText: string | null;

  @Column({ type: 'text', nullable: true })
  headerImage: Buffer | '';

  @Column({ type: 'text', nullable: true })
  reportHeaderImage: string | null;

  @Column({
    type: 'enum',
    enum: FooterType,
    nullable: true,
  })
  reportFooterType: FooterType | null;

  @Column({ type: 'text', nullable: true })
  reportFooterContent: string | null;

  @Column({ type: 'json', nullable: true })
  reportPadding: {
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
  };
}
