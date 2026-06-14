import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * A locked accounting month. The row's existence is the lock: any
 * posting whose entry date falls inside (year, month) is rejected at
 * the ledger chokepoint until an admin unlocks it.
 */
@Entity('fiscal_period_locks')
export class FiscalPeriodLock {
  @PrimaryColumn({ type: 'integer' })
  year!: number;

  /** 1-12. */
  @PrimaryColumn({ type: 'integer' })
  month!: number;

  @Column({ type: 'uuid', name: 'locked_by_user_id' })
  lockedByUserId!: string;

  @Column({ type: 'timestamp', name: 'locked_at', default: () => 'now()' })
  lockedAt!: Date;
}
