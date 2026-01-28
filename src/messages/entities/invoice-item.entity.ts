import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Product } from './product.entity';

@Entity()
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string; // Copied from Product name

  @Column('decimal', { precision: 12, scale: 2 })
  quantity: number;

//   @Column('decimal', { precision: 12, scale: 2 })
//   unit_price: number;

  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => Invoice, (invoice) => invoice.items)
  invoice: Invoice;
}