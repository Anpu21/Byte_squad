import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { PayherePaymentAttemptStatus } from '@common/enums/payhere-payment-attempt-status.enum';

@Entity('payhere_payment_attempts')
@Index(['orderId'])
@Index(['providerOrderId'], { unique: true })
export class PayherePaymentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => CustomerOrder, (order) => order.paymentAttempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: CustomerOrder;

  @Column({ type: 'varchar', name: 'provider_order_id', unique: true })
  providerOrderId!: string;

  @Column({ type: 'varchar', name: 'payhere_payment_id', nullable: true })
  payherePaymentId!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'LKR' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PayherePaymentAttemptStatus,
    default: PayherePaymentAttemptStatus.PENDING,
  })
  status!: PayherePaymentAttemptStatus;

  @Column({ type: 'boolean', name: 'signature_valid', default: false })
  signatureValid!: boolean;

  @Column({ type: 'jsonb', name: 'notify_payload', nullable: true })
  notifyPayload!: Record<string, string> | null;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'failed_at', nullable: true })
  failedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
