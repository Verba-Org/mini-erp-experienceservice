import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { Party } from './party.entity';
import { Invoice } from './invoice.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'CA' }) // 'CA' for Canada, 'IN' for India
  country: string;

  @Column({ nullable: true })
  tax_id: string; // Business Number or GSTIN

  @OneToMany(() => Product, (product) => product.organization)
  products: Product[];

  @OneToMany(() => Party, (party) => party.organization)
  parties: Party[];

  @OneToMany(() => Invoice, (invoice) => invoice.organization)
  invoices: Invoice[];
}
