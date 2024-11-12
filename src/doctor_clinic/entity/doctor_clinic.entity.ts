// src/doctor-clinic/entity/doctor-clinic.entity.ts

import { Clinic } from 'src/clininc/entity/clininc.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('doctor_clinic')
export class DoctorClinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctorClinics, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctorClinics, { onDelete: 'CASCADE' })
  clinic: Clinic;
}
