import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { DiscountType } from '../../../../../shared/constants/enums.js';
import { Transaction } from './transaction.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity('transaction_items')
export class TransactionItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'transaction_id' })
    transactionId!: string;

    @ManyToOne(() => Transaction, (transaction) => transaction.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'transaction_id' })
    transaction!: Transaction;

    @Column({ type: 'uuid', name: 'product_id' })
    productId!: string;

    @ManyToOne(() => Product, (product) => product.transactionItems, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({ type: 'integer' })
    quantity!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
    unitPrice!: number;

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

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_total' })
    lineTotal!: number;
}
