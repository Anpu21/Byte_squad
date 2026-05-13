import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';

export type PendingBranchActionType = 'create' | 'update' | 'delete';

export type PendingBranchActionPayload = Record<string, unknown> | null;

@Entity('pending_branch_actions')
@Index(['userId'])
@Index(['expiresAt'])
export class PendingBranchAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 16, name: 'action_type' })
  actionType!: PendingBranchActionType;

  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId!: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: PendingBranchActionPayload;

  @Column({ type: 'varchar', length: 6, name: 'otp_code' })
  otpCode!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', name: 'consumed_at', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
