import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import type { PosPaymentMethod } from '@pos/types';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ type: 'varchar', length: 64, name: 'receipt_no', unique: true })
  receiptNo!: string;

  @Column({ type: 'varchar', length: 32, name: 'payment_method' })
  paymentMethod!: PosPaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'payment_amount' })
  paymentAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'invoice_total' })
  invoiceTotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'cash_tendered',
    default: 0,
  })
  cashTendered!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'cash_amount',
    default: 0,
  })
  cashAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'cash_change',
    default: 0,
  })
  cashChange!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'cheque_amount',
    default: 0,
  })
  chequeAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'bank_transfer_amount',
    default: 0,
  })
  bankTransferAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'credit_amount',
    default: 0,
  })
  creditAmount!: number;

  @Column({ type: 'boolean', name: 'keep_balance', default: false })
  keepBalance!: boolean;

  @Column({ type: 'varchar', length: 64, name: 'cheque_no', nullable: true })
  chequeNo!: string | null;

  @Column({ type: 'date', name: 'cheque_date', nullable: true })
  chequeDate!: Date | null;

  @Column({ type: 'varchar', length: 128, name: 'cheque_bank', nullable: true })
  chequeBank!: string | null;

  @Column({
    type: 'varchar',
    length: 128,
    name: 'cheque_branch',
    nullable: true,
  })
  chequeBranch!: string | null;

  @Column({
    type: 'varchar',
    length: 128,
    name: 'cheque_delivered_by',
    nullable: true,
  })
  chequeDeliveredBy!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'cheque_ref', nullable: true })
  chequeRef!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'bank_ref', nullable: true })
  bankRef!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'Active' })
  status!: 'Active' | 'Voided';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
