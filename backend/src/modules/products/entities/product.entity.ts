import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'varchar', unique: true })
    barcode!: string;

    @Column({ type: 'varchar', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar' })
    category!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_price' })
    costPrice!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'selling_price' })
    sellingPrice!: number;

    @Column({ type: 'varchar', name: 'image_url', nullable: true })
    imageUrl!: string | null;

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive!: boolean;

    @OneToMany(() => Inventory, (inventory) => inventory.product)
    inventoryRecords!: Inventory[];

    @OneToMany(() => TransactionItem, (item) => item.product)
    transactionItems!: TransactionItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
