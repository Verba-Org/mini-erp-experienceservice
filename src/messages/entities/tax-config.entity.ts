// A tax entity with country-specific tax configurations
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TaxConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'IN' })
  country: string; // 'CA' for Canada, 'IN' for India

  @Column('decimal', { precision: 5, scale: 2, default: 18.0 })
  rate: number; // e.g., 13.00 for 13%

  @Column({ default: 'HST' })
  tax_type: string; // e.g., 'HST', 'GST'
}
