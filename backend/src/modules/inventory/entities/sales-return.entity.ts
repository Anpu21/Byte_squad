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
import { User } from '@users/entities/user.entity';
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

  // 'Refund' — a cash/ledger refund (default). 'Exchange' — settled by a
  // replacement sale; excluded from cash-refund KPIs.
  @Column({ type: 'varchar', length: 16, default: 'Refund' })
  type!: string;

  // The replacement Sale issued for an exchange (NULL for a plain refund).
  @Column({ type: 'uuid', name: 'replacement_sale_id', nullable: true })
  replacementSaleId!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  // The cashier/manager/admin who processed the return. Never eager-load or
  // leftJoinAndSelect this (it would serialize the password hash) — the list
  // query selects only id/first_name/last_name.
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @OneToMany(() => SalesReturnItem, (item) => item.salesReturn, {
    cascade: true,
  })
  items!: SalesReturnItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
