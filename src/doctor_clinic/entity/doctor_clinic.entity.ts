import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Doctor } from '../../doctor/entity/doctor.entity';
import { Clinic } from '../../clininc/entity/clininc.entity';

@Entity('doctor_clinic')
export class DoctorClinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctorClinics, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctorClinics, { onDelete: 'CASCADE' })
  clinic: Clinic;
}
