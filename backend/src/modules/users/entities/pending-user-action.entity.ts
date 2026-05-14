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

export type PendingUserActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'reset-password';

export type PendingUserActionPayload = Record<string, unknown> | null;

@Entity('pending_user_actions')
@Index(['userId'])
@Index(['expiresAt'])
@Index(['targetUserId'])
export class PendingUserAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 24, name: 'action_type' })
  actionType!: PendingUserActionType;

  @Column({ type: 'uuid', name: 'target_user_id', nullable: true })
  targetUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: PendingUserActionPayload;

  @Column({ type: 'varchar', length: 6, name: 'otp_code' })
  otpCode!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', name: 'consumed_at', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
