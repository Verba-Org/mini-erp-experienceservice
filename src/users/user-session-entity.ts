import { Column, Entity, PrimaryColumn } from 'typeorm';

// This entity is used to store user session information, such as active orders and session expiration time.
@Entity()
export class UserSessionEntity {
  @PrimaryColumn()
  phoneNumber: string;

  @Column('simple-json', { nullable: true })
  activeOrders: string[];

  @Column()
  expiresAt: Date;
}
