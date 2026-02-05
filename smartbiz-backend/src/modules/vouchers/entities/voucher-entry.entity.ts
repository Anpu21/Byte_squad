import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { Ledger } from '@modules/ledgers/entities/ledger.entity';

@Entity('voucher_entries')
export class VoucherEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    voucherId: string;

    @ManyToOne(() => Voucher, (voucher) => voucher.entries, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'voucherId' })
    voucher: Voucher;

    @Column()
    ledgerId: string;

    @ManyToOne(() => Ledger, (ledger) => ledger.entries)
    @JoinColumn({ name: 'ledgerId' })
    ledger: Ledger;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    debitAmount: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    creditAmount: number;

    @Column({ nullable: true })
    narration: string;

    // For inventory-linked entries
    @Column({ nullable: true })
    itemId: string;

    @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
    quantity: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    rate: number;

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;
}
