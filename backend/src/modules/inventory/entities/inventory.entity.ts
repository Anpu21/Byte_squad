import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
    Unique,}
     from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';

@Entity('inventory')
@Unique(['productId', 'branchId'])
export class Inventory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'product_id' })
    productId!: string;

    @ManyToOne(() => Product, (product) => product.inventoryRecords, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({ type: 'uuid', name: 'branch_id' })
    branchId!: string;

    @ManyToOne(() => Branch, (branch) => branch.inventoryItems, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Column({ type: 'integer', default: 0 })
    quantity!: number;

    @Column({ type: 'integer', name: 'low_stock_threshold', default: 10 })
    lowStockThreshold!: number;

    @Column({ type: 'timestamp', name: 'last_restocked_at', nullable: true })
    lastRestockedAt!: Date | null;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
