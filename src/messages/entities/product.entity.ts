import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 12, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  current_stock: number;

  @ManyToOne(() => Organization, organization => organization.products)
  organization: Organization;
}