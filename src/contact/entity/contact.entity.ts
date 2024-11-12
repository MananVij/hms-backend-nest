import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.enitiy';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 }) // Phone number length may vary
  phone_number: string;

  @Column({ length: 6 }) // Pincode length
  pincode: string;

  @Column({ length: 255 }) // Address line 1
  line1: string;

  @Column({ length: 255, nullable: true }) // Address line 2 (optional)
  line2: string;

  @Column({ length: 5 }) // Country code, e.g., +1, +91
  country_code: string;

  @ManyToOne(() => User, (user) => user.contacts, { onDelete: 'CASCADE' }) // Foreign key to User entity
  @JoinColumn({ name: 'uid' }) // Maps uid to user.uid
  user: User;
}
