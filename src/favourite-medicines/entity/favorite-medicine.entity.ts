import { Doctor } from 'src/doctor/entity/doctor.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Medicine } from '../../medicine/entity/medicine.entity';

@Entity('favorite_medicines')
export class FavoriteMedicine {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Medicine, { eager: true })
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine;
}
