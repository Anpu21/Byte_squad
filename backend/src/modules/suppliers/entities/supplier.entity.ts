import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { SupplierStatus } from '@/modules/suppliers/types/supplier-status.type';

/**
 * Supplier master — the "party" in BUSY terms. Global (not branch-scoped):
 * branches buy from the same vendors and the purchase documents carry the
 * branch. `userId` keeps the record portal-ready, but suppliers are records,
 * not logins — the staff-only flow never sets it.
 */
@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({
    type: 'varchar',
    length: 120,
    name: 'contact_name',
    nullable: true,
  })
  contactName!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  /** Due date for a GRN bill = grnDate + creditTermDays. */
  @Column({ type: 'integer', name: 'credit_term_days', default: 30 })
  creditTermDays!: number;

  /** Amount already owed when the supplier was onboarded. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'opening_balance',
    default: 0,
  })
  openingBalance!: number;

  @Column({ type: 'varchar', length: 16, default: 'Active' })
  status!: SupplierStatus;

  /** Portal-ready link to a login — intentionally unused for now. */
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
