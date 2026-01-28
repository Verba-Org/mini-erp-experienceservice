import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class Party {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column() // SQLite doesn't support enum, use varchar instead
  type: string; // 'CUSTOMER' or 'VENDOR'

  @Column({ nullable: true })
  phone: string;

  @ManyToOne(() => Organization, organization => organization.parties)
  organization: Organization;
}