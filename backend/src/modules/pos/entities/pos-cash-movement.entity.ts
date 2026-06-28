import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PosShift } from '@pos/entities/pos-shift.entity';
import type { CashMovementType } from '@pos/types/cash-movement-type.type';

/**
 * A mid-shift cash drawer adjustment: cash paid in (e.g. a float top-up) or
 * paid out (e.g. petty cash, a supplier paid in cash). Folded into the shift's
 * expected-cash reconciliation so the day-end over/short can be explained.
 * Amount is always positive; `type` carries the direction.
 */
@Entity('pos_cash_movements')
@Index(['shiftId'])
export class PosCashMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'shift_id' })
  shiftId!: string;

  @ManyToOne(() => PosShift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift!: PosShift;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @Column({ type: 'uuid', name: 'cashier_id' })
  cashierId!: string;

  @Column({ type: 'varchar', length: 16 })
  type!: CashMovementType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
