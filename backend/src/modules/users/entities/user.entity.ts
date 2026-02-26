import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { Branch } from '@branches/entities/branch.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', name: 'password_hash' })
    passwordHash!: string;

    @Column({ type: 'varchar', name: 'first_name' })
    firstName!: string;

    @Column({ type: 'varchar', name: 'last_name' })
    lastName!: string;

    @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
    avatarUrl!: string | null;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CASHIER })
    role!: UserRole;

    @Column({ type: 'uuid', name: 'branch_id' })
    branchId!: string;

    @ManyToOne(() => Branch, (branch) => branch.users, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Column({ type: 'boolean', name: 'is_first_login', default: true })
    isFirstLogin!: boolean;

    @Column({ type: 'varchar', name: 'otp_code', nullable: true })
    otpCode!: string | null;

    @Column({ type: 'timestamp', name: 'otp_expires_at', nullable: true })
    otpExpiresAt!: Date | null;

    @Column({ type: 'boolean', name: 'is_verified', default: false })
    isVerified!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
