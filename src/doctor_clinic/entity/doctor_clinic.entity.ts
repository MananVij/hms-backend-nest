import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity('doctor_clinic')
export class DoctorClinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctorClinics)
  doctor: Doctor;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctorClinics)
  clinic: Clinic;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
