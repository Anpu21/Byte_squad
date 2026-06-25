import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Loyalty wallet, polymorphically owned by either an online customer
 * (user_id) or a walk-in customer (loyalty_customer_id). Exactly one
 * of the two FK columns is set at any time; the invariant is enforced
 * by a CHECK constraint and a pair of partial unique indexes declared
 * in `LoyaltyPhoneUniqueAndBranch` (TypeORM 0.3 cannot express
 * partial uniques reliably through decorators, so they live in raw
 * SQL rather than here).
 */
@Entity('loyalty_accounts')
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', name: 'loyalty_customer_id', nullable: true })
  loyaltyCustomerId!: string | null;

  @Column({ type: 'int', name: 'points_balance', default: 0 })
  pointsBalance!: number;

  @Column({ type: 'int', name: 'lifetime_points_earned', default: 0 })
  lifetimePointsEarned!: number;

  @Column({ type: 'int', name: 'lifetime_points_redeemed', default: 0 })
  lifetimePointsRedeemed!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
