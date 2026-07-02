import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';

export type StockMovementType =
  | 'Sale'
  | 'Sale_Voided'
  | 'Purchase'
  | 'Transfer_In'
  | 'Transfer_Out'
  | 'Adjustment'
  | 'Return'
  // Units returned in damaged condition. Recorded for audit only — they do
  // NOT re-enter sellable stock, so `qty_in` here is the damaged quantity and
  // `balance_after` is the unchanged sellable balance.
  | 'Damage';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @Column({ type: 'varchar', length: 64, default: 'Shop' })
  location!: string;

  @Column({ type: 'varchar', length: 32, name: 'movement_type' })
  movementType!: StockMovementType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'qty_in',
    default: 0,
  })
  qtyIn!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'qty_out',
    default: 0,
  })
  qtyOut!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'balance_after',
  })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 32, name: 'ref_type', nullable: true })
  refType!: string | null;

  @Column({ type: 'uuid', name: 'ref_id', nullable: true })
  refId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
