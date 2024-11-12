import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sidebar')
export class SideBar {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 20 })
  title: string;

  @Column()
  icon: string;

  @Column()
  highlighted_icon: string;

  @Column()
  path: string;

  @Column('text', {array: true})
  roles: string[];

  @Column({ type: 'int' })
  index: number;
}
