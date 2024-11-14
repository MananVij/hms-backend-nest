import { Appointment } from 'src/appointment/entity/appointment.entity';
import { Doctor } from 'src/doctor/entity/doctor.entity';
import { DoctorClinic } from 'src/doctor_clinic/entity/doctor_clinic.entity';
import { User } from 'src/user/entity/user.enitiy';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('clinic')
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  timings: string;

  @Column()
  fee: number;

  @Column({ default: false })
  is_online: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @Column('json')
  contact_number: {
    phone_no: string;
    is_verified: boolean;
  }[];

  @ManyToOne(() => User, (user) => user.clinics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: User; // Admin associated with the clinic

  @OneToMany(() => DoctorClinic, (doctorClinic) => doctorClinic.clinic)
  doctorClinics: DoctorClinic[];

  @OneToMany(() => Appointment, appointment => appointment.clinic)
  appointments: Appointment[]; // One clinic can have many appointments
}
