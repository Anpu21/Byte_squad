import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { CustomerOrderPaymentMode } from '@common/enums/customer-order-payment-mode.enum';
import { CustomerOrderPaymentStatus } from '@common/enums/customer-order-payment-status.enum';
import { PayherePaymentAttempt } from '@/modules/customer-orders/entities/payhere-payment-attempt.entity';

@Entity('customer_orders')
@Index(['branchId'])
@Index(['userId'])
@Index(['status'])
@Index(['groupCode'])
@Index(['customerGroupId'])
export class CustomerOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'order_code', unique: true })
  orderCode!: string;

  /**
   * Links the per-branch orders created from one multi-branch checkout so a
   * single PayHere payment can settle them together. Null for legacy/single
   * orders created via the plain create() path.
   */
  @Column({ type: 'varchar', name: 'group_code', nullable: true })
  groupCode!: string | null;

  /**
   * Links this order to the CustomerGroup whose shared cart produced it (a
   * "shop together" group checkout) so the group's analytics can roll it up.
   * Scalar-only (no relation) to avoid a customer-orders → customer-groups
   * import cycle — the FK lives in the DB. DISTINCT from `groupCode`, which only
   * batches one multi-branch checkout for a single PayHere payment.
   */
  @Column({ type: 'uuid', name: 'customer_group_id', nullable: true })
  customerGroupId!: string | null;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({
    type: 'enum',
    enum: CustomerOrderStatus,
    default: CustomerOrderStatus.PENDING,
  })
  status!: CustomerOrderStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'estimated_total',
    default: 0,
  })
  estimatedTotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'loyalty_discount_amount',
    default: 0,
  })
  loyaltyDiscountAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'final_total',
    default: 0,
  })
  finalTotal!: number;

  @Column({
    type: 'enum',
    enum: CustomerOrderPaymentMode,
    name: 'payment_mode',
    default: CustomerOrderPaymentMode.MANUAL,
  })
  paymentMode!: CustomerOrderPaymentMode;

  @Column({
    type: 'enum',
    enum: CustomerOrderPaymentStatus,
    name: 'payment_status',
    default: CustomerOrderPaymentStatus.UNPAID,
  })
  paymentStatus!: CustomerOrderPaymentStatus;

  @Column({
    type: 'int',
    name: 'loyalty_points_redeemed',
    default: 0,
  })
  loyaltyPointsRedeemed!: number;

  @Column({
    type: 'int',
    name: 'loyalty_points_earned',
    default: 0,
  })
  loyaltyPointsEarned!: number;

  @Column({ type: 'varchar', name: 'guest_name', nullable: true })
  guestName!: string | null;

  @Column({ type: 'varchar', name: 'note', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid', name: 'fulfilled_transaction_id', nullable: true })
  fulfilledTransactionId!: string | null;

  @Column({ type: 'varchar', name: 'qr_code_url', nullable: true })
  qrCodeUrl!: string | null;

  @OneToMany(() => CustomerOrderItem, (item) => item.order, {
    cascade: true,
  })
  items!: CustomerOrderItem[];

  @OneToMany(() => PayherePaymentAttempt, (attempt) => attempt.order)
  paymentAttempts!: PayherePaymentAttempt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
