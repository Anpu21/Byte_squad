import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';
import { CustomerGroupMemberRole } from '@common/enums/customer-group-member-role.enum';

/**
 * CustomerGroupMember — a User's membership in a CustomerGroup. Exactly one
 * OWNER per group (the creator); everyone who joins by code is a MEMBER. A user
 * may belong to many groups, so `(customerGroupId, userId)` is unique.
 */
@Entity('customer_group_members')
@Index('IDX_customer_group_members_user_id', ['userId'])
@Index('UQ_customer_group_members_group_user', ['customerGroupId', 'userId'], {
  unique: true,
})
export class CustomerGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'customer_group_id' })
  customerGroupId!: string;

  @ManyToOne(() => CustomerGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_group_id' })
  group!: CustomerGroup;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'varchar',
    length: 16,
    default: CustomerGroupMemberRole.MEMBER,
  })
  role!: CustomerGroupMemberRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}
