import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CustomerStatus } from '@/modules/customers/types/customer-status.type';

/**
 * CustomerProfile — the lightweight side-table that gives phone-stitched
 * customers a home for *management* metadata (tags, notes, segment, status,
 * merge alias). It is deliberately NOT a canonical customer master: there are
 * no FKs to users/loyalty/credit; rows are keyed by `customerKey` (normalized
 * phone `94…` or `u:<userId>`) and left-joined at read time by the aggregation.
 *
 * A row is created lazily the first time staff tag / note / block / merge a
 * customer — most customers never get one, and the hub reads work without it.
 */
@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('UQ_customer_profiles_customer_key', { unique: true })
  @Column({ type: 'varchar', length: 64, name: 'customer_key' })
  customerKey!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  tags!: string[];

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  segment!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: CustomerStatus;

  // Optional staff-set display name; otherwise the hub derives one from the
  // underlying source records (user / walk-in / khata holder name).
  @Column({
    type: 'varchar',
    length: 120,
    name: 'display_name',
    nullable: true,
  })
  displayName!: string | null;

  // Manual merge/link alias: point this identity at a canonical registered user.
  @Column({ type: 'uuid', name: 'linked_user_id', nullable: true })
  linkedUserId!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id', nullable: true })
  createdByUserId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
