import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { Branch } from '@branches/entities/branch.entity';
import { PurchaseOrderItem } from '@/modules/purchases-orders/entities/purchase-order-item.entity';
import type { PurchaseOrderStatus } from '@/modules/purchases-orders/types/purchase-order-status.type';

/**
 * Purchase order — intent only. No stock or ledger effect; its job is the
 * pending-orders view and pre-filling the GRN when the goods arrive
 * (Draft → Sent → Received via GRN conversion, or Cancelled).
 */
@Entity('purchase_orders')
@Index(['branchId', 'status'])
@Index(['supplierId'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 24, name: 'po_number', unique: true })
  poNumber!: string;

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

  @Column({ type: 'varchar', length: 16, default: 'Draft' })
  status!: PurchaseOrderStatus;

  @Column({ type: 'date', name: 'expected_date', nullable: true })
  expectedDate!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_value' })
  totalValue!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  items!: PurchaseOrderItem[];

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
