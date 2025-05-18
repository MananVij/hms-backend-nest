import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ name: 'pack_size' })
  packSize: string;

  @Column()
  manufacturer: string;

  @Column()
  composition: string;
}
