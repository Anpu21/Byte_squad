import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Walk-in loyalty member identified by phone number alone (no email,
 * no password, no auth session). Created on the spot at the POS when
 * a cashier looks up a phone that doesn't match an existing user or
 * walk-in record. When the same phone later signs up online via the
 * storefront, an admin merge action re-points the wallet from
 * loyalty_customer_id -> user_id (one-way migration; tracked
 * separately in BE-L2 / FE-L2).
 */
@Entity('loyalty_customers')
@Index(['phone'], { unique: true })
export class LoyaltyCustomer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  @Column({ type: 'varchar', length: 60, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 60, name: 'last_name', nullable: true })
  lastName!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
