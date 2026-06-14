import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Grn } from '@/modules/purchases/entities/grn.entity';
import { SupplierPayment } from '@/modules/purchases/entities/supplier-payment.entity';

/**
 * One slice of a supplier payment applied to a specific bill. A null
 * `grnId` means the slice settles the supplier's opening balance —
 * the pre-LedgerPro debt that has no GRN behind it.
 */
@Entity('supplier_payment_allocations')
@Index(['paymentId'])
@Index(['grnId'])
export class SupplierPaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId!: string;

  @ManyToOne(() => SupplierPayment, (p) => p.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment!: SupplierPayment;

  @Column({ type: 'uuid', name: 'grn_id', nullable: true })
  grnId!: string | null;

  @ManyToOne(() => Grn, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'grn_id' })
  grn!: Grn | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;
}
