import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.enitiy';
import { DoctorClinic } from '../../doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from '../../doctor_patient/entity/doctor_patient.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn() // Auto-incrementing integer ID
  id: number;

  @Column('jsonb') // Array of objects for qualifications
  qualification: {
    qualification: string;
    college: string;
    notes?: string;
  }[];

  @Column({ unique: true }) // Unique license number
  license_number: string;

  @Column({ nullable: false }) // Specialization is required
  specialization: string;

  @Column({ type: 'date' }) // Date of practice start
  start_date_of_practice: Date;

  @Column('simple-array') // Array of strings for languages spoken
  languages_spoken: string[];

  @Column('jsonb') // Timings represented in JSON format
  timings: {
    day: string;
    start_time: string; // Format as HH:MM
    end_time: string;   // Format as HH:MM
  }[];

  @OneToOne(() => User, (user) => user.doctor, { nullable: false, onDelete: 'CASCADE' })  // Link to the User entity
  @JoinColumn({ name: 'user_id' })  // Creates the foreign key to User
  user: User;

  @OneToMany(() => DoctorClinic, (doctorClinic) => doctorClinic.doctor)
  doctorClinics: DoctorClinic[];

  @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.doctor)
  patients: DoctorPatient[];
}
