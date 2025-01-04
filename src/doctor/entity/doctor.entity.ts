import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { DoctorPatient } from 'src/doctor_patient/entity/doctor_patient.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn() // Auto-incrementing integer ID
  id: number;

  @Column({ default: '' }) // Array of objects for qualifications
  qualification: string;

  @Column({ nullable: false })
  fee: number;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ unique: true }) // Unique license number
  licenseNumber: string;

  @Column({ nullable: false }) // Specialization is required
  specialization: string;

  @Column({ type: 'date' }) // Date of practice start
  startYearOfPractice: Date;

  @Column('jsonb') // Timings represented in JSON format
  timings: {
    day: string;
    startTime: Date; // Format as HH:MM
    endTime: Date; // Format as HH:MM
  }[];

  @OneToOne(() => User, (user) => user.doctor, {
    nullable: false,
  }) // Link to the User entity
  @JoinColumn({ name: 'user_id' }) // Creates the foreign key to User
  user: User;

  @OneToMany(() => DoctorClinic, (doctorClinic) => doctorClinic.doctor, {
    onDelete: 'CASCADE',
  })
  doctorClinics: DoctorClinic[];

  @OneToMany(() => DoctorPatient, (doctorPatient) => doctorPatient.doctor, {
    onDelete: 'CASCADE',
  })
  patients: DoctorPatient[];
}
