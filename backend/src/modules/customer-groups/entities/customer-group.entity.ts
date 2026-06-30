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
import { User } from '@users/entities/user.entity';
import { CustomerGroupStatus } from '@common/enums/customer-group-status.enum';

/**
 * CustomerGroup — a "shop together" group that registered storefront customers
 * form (family / household / hostel / office). The creator is the OWNER; others
 * join via the shareable `joinCode`. The group owns a single shared cart
 * (GroupCartItem) and its purchases (CustomerOrder.customerGroupId) roll up into
 * group analytics. Cross-branch by nature — scoped by membership, NOT branchId.
 */
@Entity('customer_groups')
@Index('IDX_customer_groups_owner_user_id', ['ownerUserId'])
export class CustomerGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  // Shareable invite code (e.g. FAM-AB12CD49). Named unique index so TypeORM
  // sync (dev) and the CreateCustomerGroups migration (prod) converge on one
  // constraint instead of two uniqueness checks.
  @Index('UQ_customer_groups_join_code', { unique: true })
  @Column({ type: 'varchar', length: 24, name: 'join_code' })
  joinCode!: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @Column({ type: 'varchar', length: 16, default: CustomerGroupStatus.ACTIVE })
  status!: CustomerGroupStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
