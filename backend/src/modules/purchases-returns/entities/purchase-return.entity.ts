import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Grn } from '@/modules/purchases-grn/entities/grn.entity';
import { PurchaseReturnItem } from '@/modules/purchases-returns/entities/purchase-return-item.entity';

/**
 * Purchase return — the debit note. Goods go back to the supplier: stock
 * OUT, a CREDIT ledger reversal, and the originating GRN bill's
 * outstanding shrinks by the return total (BUSY's against-reference
 * adjustment).
 */
@Entity('purchase_returns')
@Index(['grnId'])
@Index(['supplierId'])
export class PurchaseReturn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 24, name: 'return_number', unique: true })
  returnNumber!: string;

  @Column({ type: 'uuid', name: 'grn_id' })
  grnId!: string;

  @ManyToOne(() => Grn, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'grn_id' })
  grn!: Grn;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId!: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ type: 'text' })
  reason!: string;

  @OneToMany(() => PurchaseReturnItem, (item) => item.purchaseReturn)
  items!: PurchaseReturnItem[];

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
