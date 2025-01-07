import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { User } from 'src/user/entity/user.enitiy';

@Entity('doctor_patient')
export class DoctorPatient {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.patients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => User, (user) => user.doctors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
