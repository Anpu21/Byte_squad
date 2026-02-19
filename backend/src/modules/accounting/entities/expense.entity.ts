import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'branch_id' })
    branchId!: string;

    @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Column({ type: 'uuid', name: 'created_by' })
    createdBy!: string;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'created_by' })
    creator!: User;

    @Column({ type: 'varchar' })
    category!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount!: number;

    @Column({ type: 'varchar' })
    description!: string;

    @Column({ type: 'date', name: 'expense_date' })
    expenseDate!: Date;

    @Column({ type: 'varchar', name: 'receipt_url', nullable: true })
    receiptUrl!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
