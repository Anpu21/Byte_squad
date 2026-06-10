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
import { SupplierPaymentAllocation } from '@/modules/purchases/entities/supplier-payment-allocation.entity';
import type { SupplierPaymentMethod } from '@/modules/purchases/types/supplier-payment-method.type';

/**
 * Payment voucher to a supplier. The amount is fully allocated against
 * specific bills (GRNs) — or the supplier's opening balance — BUSY's
 * bill-by-bill "Against Reference" model, which is what makes the
 * outstanding/ageing reports per-invoice instead of one lump sum.
 */
@Entity('supplier_payments')
@Index(['supplierId'])
@Index(['branchId', 'paidAt'])
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 24,
    name: 'payment_number',
    unique: true,
  })
  paymentNumber!: string;

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

  @Column({ type: 'varchar', length: 16 })
  method!: SupplierPaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'date', name: 'paid_at' })
  paidAt!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => SupplierPaymentAllocation, (a) => a.payment)
  allocations!: SupplierPaymentAllocation[];

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
