import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import { Branch } from '@branches/entities/branch.entity';
import { SalesReturnItem } from '@inventory/entities/sales-return-item.entity';

/**
 * SalesReturn — a customer return against a POS sale (Phase C3).
 *
 * A partial, item-level reversal of a sale: good units can be restocked, bad
 * units are scrapped, and the customer is refunded (a DEBIT ledger entry).
 * Mirrors the void flow in `pos-void.service.ts` but at line granularity.
 */
@Entity('sales_returns')
@Index(['branchId', 'createdAt'])
@Index(['saleId'])
@Index(['invoiceNumber'])
export class SalesReturn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ type: 'varchar', name: 'invoice_number' })
  invoiceNumber!: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid', name: 'customer_user_id', nullable: true })
  customerUserId!: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_refund_amount',
    default: 0,
  })
  totalRefundAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'restocked_value',
    default: 0,
  })
  restockedValue!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'Completed' })
  status!: string;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @OneToMany(() => SalesReturnItem, (item) => item.salesReturn, {
    cascade: true,
  })
  items!: SalesReturnItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
