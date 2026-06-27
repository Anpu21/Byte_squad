import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import type { ShiftStatus } from '@pos/types/shift-status.type';

/**
 * A cashier drawer session. Opened with a float; closing snapshots the
 * window's tender totals (from Active sales/payments), the expected cash
 * (float + cash takings − refunds), the counted cash, and the over/short
 * — the Z-report rows. One open shift per cashier at a time.
 */
@Entity('pos_shifts')
@Index(['branchId', 'status'])
@Index(['cashierId', 'status'])
export class PosShift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid', name: 'cashier_id' })
  cashierId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cashier_id' })
  cashier!: User;

  @Column({ type: 'varchar', length: 16, default: 'Open' })
  status!: ShiftStatus;

  @CreateDateColumn({ name: 'opened_at' })
  openedAt!: Date;

  @Column({ type: 'timestamp', name: 'closed_at', nullable: true })
  closedAt!: Date | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'opening_float',
    default: 0,
  })
  openingFloat!: number;

  // ── Close-time snapshot (null while Open) ────────────────────────────
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'counted_cash',
    nullable: true,
  })
  countedCash!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'expected_cash',
    nullable: true,
  })
  expectedCash!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'over_short',
    nullable: true,
  })
  overShort!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_cash',
    nullable: true,
  })
  totalCash!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_cheque',
    nullable: true,
  })
  totalCheque!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_bank',
    nullable: true,
  })
  totalBank!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_credit',
    nullable: true,
  })
  totalCredit!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_electronic',
    nullable: true,
  })
  totalElectronic!: number | null;

  @Column({ type: 'integer', name: 'sales_count', nullable: true })
  salesCount!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'sales_total',
    nullable: true,
  })
  salesTotal!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'refunds_total',
    nullable: true,
  })
  refundsTotal!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_pay_in',
    nullable: true,
  })
  totalPayIn!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_pay_out',
    nullable: true,
  })
  totalPayOut!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
