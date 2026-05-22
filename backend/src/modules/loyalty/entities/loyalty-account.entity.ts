import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('loyalty_accounts')
@Index(['userId'], { unique: true })
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

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
