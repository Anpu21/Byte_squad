import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export const LOYALTY_SETTINGS_ROW_ID = 'default';

@Entity('loyalty_settings')
export class LoyaltySettings {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'int', name: 'earn_points', default: 1 })
  earnPoints!: number;

  @Column({ type: 'int', name: 'earn_per_amount', default: 100 })
  earnPerAmount!: number;

  @Column({
    type: 'decimal',
    name: 'point_value',
    precision: 10,
    scale: 2,
    default: 1,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number | null) =>
        v === null || v === undefined ? 0 : Number(v),
    },
  })
  pointValue!: number;

  @Column({ type: 'int', name: 'redeem_cap_percent', default: 20 })
  redeemCapPercent!: number;

  @Column({ type: 'uuid', name: 'updated_by_user_id', nullable: true })
  updatedByUserId!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
