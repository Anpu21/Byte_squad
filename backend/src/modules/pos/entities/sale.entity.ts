import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { TransactionType } from '@/common/enums/transaction.enum';
import { DiscountType } from '@/common/enums/discount.enum';
import { PaymentMethod } from '@/common/enums/payment-method';
import type {
  SaleStatus,
  SalePaymentStatus,
  PriceLevel,
  SaleType,
} from '@pos/types';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'transaction_number', unique: true })
  transactionNumber!: string;

  @Column({ type: 'varchar', name: 'invoice_number', unique: true })
  invoiceNumber!: string;

  @Column({ type: 'boolean', name: 'bill_printed', default: false })
  billPrinted!: boolean;

  @Column({ type: 'int', name: 'bill_print_count', default: 0 })
  billPrintCount!: number;

  @Column({ type: 'timestamp', name: 'first_print_date', nullable: true })
  firstPrintDate!: Date | null;

  @Column({ type: 'timestamp', name: 'last_print_date', nullable: true })
  lastPrintDate!: Date | null;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, (branch) => branch.transactions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid', name: 'cashier_id' })
  cashierId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cashier_id' })
  cashier!: User;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'discount_amount',
    default: 0,
  })
  discountAmount!: number;

  @Column({
    type: 'enum',
    enum: DiscountType,
    name: 'discount_type',
    default: DiscountType.NONE,
  })
  discountType!: DiscountType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'tax_amount',
    default: 0,
  })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  // PHASE-5: drop this column when pos.service migrates from single-tender to the payments table.
  // Kept here so the existing pos.service.ts compiles against the renamed Sale entity.
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod!: PaymentMethod;

  // -----------------------------------------------------------------
  // Phase 2 — Shanel-port columns
  // -----------------------------------------------------------------
  @Column({ type: 'varchar', length: 32, name: 'sale_type', default: 'Retail' })
  saleType!: SaleType;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'price_level',
    default: 'Retail',
  })
  priceLevel!: PriceLevel;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'discount_percentage',
    default: 0,
  })
  discountPercentage!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'tax_rate',
    default: 0,
  })
  taxRate!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'paid_amount',
    default: 0,
  })
  paidAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'balance_due',
    default: 0,
  })
  balanceDue!: number;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'payment_status',
    default: 'Unpaid',
  })
  paymentStatus!: SalePaymentStatus;

  @Column({ type: 'varchar', length: 32, default: 'Active' })
  status!: SaleStatus;

  @Column({ type: 'varchar', length: 64, default: 'Shop' })
  location!: string;

  @Column({ type: 'uuid', name: 'customer_user_id', nullable: true })
  customerUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_user_id' })
  customer!: User | null;

  @Column({ type: 'uuid', name: 'loyalty_customer_id', nullable: true })
  loyaltyCustomerId!: string | null;

  // Customer store-credit ("khata") link. Scalar-only (no relation) so the POS
  // entity stays decoupled from the credit-accounts module — same approach as
  // `loyaltyCustomerId`. Set when a sale is charged to a credit account.
  @Column({ type: 'uuid', name: 'credit_account_id', nullable: true })
  creditAccountId!: string | null;

  // Repayment due date for a credit-account sale: saleDate + account term days.
  // Drives the receivables ageing/overdue buckets. NULL for non-credit sales.
  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate!: string | null;

  // Manager/admin who authorized an over-limit credit charge at the counter
  // (the step-up override). NULL when the sale was within the credit limit.
  @Column({ type: 'uuid', name: 'credit_override_by_user_id', nullable: true })
  creditOverrideByUserId!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'voided_reason',
    nullable: true,
  })
  voidedReason!: string | null;

  @Column({ type: 'timestamp', name: 'voided_at', nullable: true })
  voidedAt!: Date | null;

  @Column({ type: 'uuid', name: 'voided_by_user_id', nullable: true })
  voidedByUserId!: string | null;

  // -----------------------------------------------------------------
  // Existing print-tracking & relations
  // -----------------------------------------------------------------
  @OneToMany(() => SaleItem, (item) => item.sale, {
    cascade: true,
  })
  items!: SaleItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
