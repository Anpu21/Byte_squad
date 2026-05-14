import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { TransferStatus } from '@common/enums/transfer-status.enum';

@Entity('stock_transfer_requests')
@Index(['status', 'createdAt'])
@Index(['destinationBranchId', 'status'])
@Index(['sourceBranchId', 'status'])
export class StockTransferRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'destination_branch_id' })
  destinationBranchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch!: Branch;

  @Column({ type: 'uuid', name: 'source_branch_id', nullable: true })
  sourceBranchId!: string | null;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch!: Branch | null;

  @Column({ type: 'integer', name: 'requested_quantity' })
  requestedQuantity!: number;

  @Column({ type: 'integer', name: 'approved_quantity', nullable: true })
  approvedQuantity!: number | null;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status!: TransferStatus;

  @Column({ type: 'text', name: 'request_reason', nullable: true })
  requestReason!: string | null;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'text', name: 'approval_note', nullable: true })
  approvalNote!: string | null;

  @Column({ type: 'uuid', name: 'batch_id', nullable: true })
  @Index()
  batchId!: string | null;

  @Column({ type: 'uuid', name: 'requested_by_user_id' })
  requestedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy!: User;

  @Column({ type: 'uuid', name: 'reviewed_by_user_id', nullable: true })
  reviewedByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedBy!: User | null;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', name: 'shipped_by_user_id', nullable: true })
  shippedByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'shipped_by_user_id' })
  shippedBy!: User | null;

  @Column({ type: 'timestamp', name: 'shipped_at', nullable: true })
  shippedAt!: Date | null;

  @Column({ type: 'uuid', name: 'received_by_user_id', nullable: true })
  receivedByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'received_by_user_id' })
  receivedBy!: User | null;

  @Column({ type: 'timestamp', name: 'received_at', nullable: true })
  receivedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
