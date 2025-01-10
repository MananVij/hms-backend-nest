import { Clinic } from 'src/clininc/entity/clininc.entity';
import { User } from 'src/user/entity/user.enitiy';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('patient_clinic')
export class PatientClinic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (patient) => patient.patientClinics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @ManyToOne(() => Clinic, (clinic) => clinic.patientClinics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
