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
import { CustomerRequestItem } from '@/modules/customer-requests/entities/customer-request-item.entity';
import { CustomerRequestStatus } from '@common/enums/customer-request.enum';

@Entity('customer_requests')
@Index(['branchId'])
@Index(['userId'])
@Index(['status'])
export class CustomerRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'request_code', unique: true })
  requestCode!: string;

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
    enum: CustomerRequestStatus,
    default: CustomerRequestStatus.PENDING,
  })
  status!: CustomerRequestStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'estimated_total',
    default: 0,
  })
  estimatedTotal!: number;

  @Column({ type: 'varchar', name: 'guest_name', nullable: true })
  guestName!: string | null;

  @Column({ type: 'varchar', name: 'note', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid', name: 'fulfilled_transaction_id', nullable: true })
  fulfilledTransactionId!: string | null;

  @OneToMany(() => CustomerRequestItem, (item) => item.request, {
    cascade: true,
  })
  items!: CustomerRequestItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
