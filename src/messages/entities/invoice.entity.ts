import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Party } from './party.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  display_number: string; // e.g., INV-1001

  @Column()
  invoice_number: number; // For sequence tracking

  @Column()
  intent: string; // CREATE_SALE, LOG_PURCHASE, CREATE_INVOICE

  @Column({ default: 'PENDING' })
  status: string; // PENDING, DELIVERED, PAID

  @Column('decimal', { precision: 12, scale: 2 })
  total_amount: number;

  @Column({ type: 'datetime', nullable: true })
  due_date: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Party)
  party: Party;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @ManyToOne(() => Organization, organization => organization.invoices)
  organization: Organization;
}