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
import { GrnItem } from '@/modules/purchases-grn/entities/grn-item.entity';
import type { GrnStatus } from '@/modules/purchases-grn/types/grn-status.type';
import type { GrnPaymentStatus } from '@/modules/purchases-grn/types/grn-payment-status.type';

/**
 * Goods Received Note — the purchase voucher. One entry does three things
 * inside a single transaction: stock IN (per line, with batch/expiry), a
 * debit ledger posting, and the supplier *bill* itself (bill-by-bill:
 * payments allocate against GRNs, advancing `paidAmount`/`paymentStatus`).
 */
@Entity('grns')
@Index(['branchId', 'grnDate'])
@Index(['supplierId'])
@Index(['paymentStatus'])
export class Grn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 24, name: 'grn_number', unique: true })
  grnNumber!: string;

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

  /** Filled by the PO slice when a GRN is created from an order. */
  @Column({ type: 'uuid', name: 'purchase_order_id', nullable: true })
  purchaseOrderId!: string | null;

  /** The supplier's own paper-invoice number, for cross-reference. */
  @Column({
    type: 'varchar',
    length: 64,
    name: 'supplier_invoice_no',
    nullable: true,
  })
  supplierInvoiceNo!: string | null;

  @Column({ type: 'date', name: 'grn_date' })
  grnDate!: string;

  /** grnDate + supplier.creditTermDays at receive time. */
  @Column({ type: 'date', name: 'due_date' })
  dueDate!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sub_total' })
  subTotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'discount_amount',
    default: 0,
  })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'grand_total' })
  grandTotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'paid_amount',
    default: 0,
  })
  paidAmount!: number;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'payment_status',
    default: 'Unpaid',
  })
  paymentStatus!: GrnPaymentStatus;

  @Column({ type: 'varchar', length: 16, default: 'Received' })
  status!: GrnStatus;

  @Column({ type: 'timestamp', name: 'voided_at', nullable: true })
  voidedAt!: Date | null;

  @Column({ type: 'uuid', name: 'voided_by_user_id', nullable: true })
  voidedByUserId!: string | null;

  @Column({ type: 'text', name: 'void_reason', nullable: true })
  voidReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => GrnItem, (item) => item.grn)
  items!: GrnItem[];

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
