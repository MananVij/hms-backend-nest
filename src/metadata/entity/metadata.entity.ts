import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.enitiy';

export enum UserSex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHERS = 'OTHERS',
}

@Entity('meta_data')
export class MetaData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: false })
  dob: Date;

  @Column({ type: 'enum', enum: UserSex, nullable: false })
  sex: string;

  @Column({ type: 'varchar', length: 10, default: '' })
  height: string;

  // Foreign key to the User table
  @OneToOne(() => User, (user) => user.metaData)
  @JoinColumn({ name: 'uid' }) // JoinColumn indicates the owning side
  user: User;
}
