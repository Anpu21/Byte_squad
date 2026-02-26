import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';

import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { TransactionType } from '@/common/enums/transaction.enum';
import { DiscountType } from '@/common/enums/discount.enum';
import { PaymentMethod } from '@/common/enums/payment-method';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', name: 'transaction_number', unique: true })
    transactionNumber!: string;

    @Column({ type: 'uuid', name: 'branch_id' })
    branchId!: string;

    @ManyToOne(() => Branch, (branch) => branch.transactions, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Column({ type: 'uuid', name: 'cashier_id' })
    cashierId!: string;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'cashier_id' })
    cashier!: User;

    @Column({ type: 'enum', enum: TransactionType })
    type!: TransactionType;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    subtotal!: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        name: 'discount_amount',
        default: 0,
    })
    discountAmount!: number;

    @Column({
        type: 'enum',
        enum: DiscountType,
        name: 'discount_type',
        default: DiscountType.NONE,
    })
    discountType!: DiscountType;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        name: 'tax_amount',
        default: 0,
    })
    taxAmount!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total!: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        name: 'payment_method',
    })
    paymentMethod!: PaymentMethod;

    @OneToMany(() => TransactionItem, (item) => item.transaction, {
        cascade: true,
    })
    items!: TransactionItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
