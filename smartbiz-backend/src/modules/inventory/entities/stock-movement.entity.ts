import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { StockMovementType } from '@common/constants/accounting.enum';

@Entity('stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    itemId: string;

    @ManyToOne(() => Item, (item) => item.stockMovements)
    @JoinColumn({ name: 'itemId' })
    item: Item;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    branchId: string;

    @Column({ type: 'text' })
    movementType: StockMovementType;

    @Column({ type: 'decimal', precision: 15, scale: 3 })
    quantity: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    rate: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    @Column({ type: 'decimal', precision: 15, scale: 3 })
    balanceAfter: number;

    // Reference to voucher/invoice
    @Column({ nullable: true })
    referenceType: string;

    @Column({ nullable: true })
    referenceId: string;

    @Column({ nullable: true })
    referenceNumber: string;

    @Column({ nullable: true })
    narration: string;

    @Column()
    createdBy: string;

    @CreateDateColumn()
    createdAt: Date;
}
