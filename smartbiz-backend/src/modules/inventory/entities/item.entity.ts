import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { ItemCategory } from './item-category.entity';
import { StockMovement } from './stock-movement.entity';
import { ValuationMethod } from '@common/constants/accounting.enum';

@Entity('items')
export class Item {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    code: string;

    @Column({ nullable: true, unique: true })
    barcode: string;

    @Column()
    name: string;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    categoryId: string;

    @ManyToOne(() => ItemCategory)
    @JoinColumn({ name: 'categoryId' })
    category: ItemCategory;

    @Column()
    unit: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    purchasePrice: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    sellingPrice: number;

    @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
    currentStock: number;

    @Column({ type: 'integer', default: 0 })
    reorderLevel: number;

    @Column({ type: 'text', default: ValuationMethod.AVERAGE })
    valuationMethod: ValuationMethod;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    averageCost: number;

    // For barcode billing
    @Column({ nullable: true })
    hsnCode: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: true })
    isSaleable: boolean;

    @Column({ default: true })
    isPurchasable: boolean;

    @OneToMany(() => StockMovement, (movement) => movement.item)
    stockMovements: StockMovement[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
