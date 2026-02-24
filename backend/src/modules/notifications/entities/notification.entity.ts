import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { NotificationType } from '../../../../../shared/constants/enums.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'varchar' })
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'enum', enum: NotificationType })
    type!: NotificationType;

    @Column({ type: 'boolean', name: 'is_read', default: false })
    isRead!: boolean;

    @Column({ type: 'jsonb', default: {} })
    metadata!: Record<string, unknown>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
