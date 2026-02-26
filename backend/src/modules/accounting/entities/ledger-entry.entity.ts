import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { Branch } from '@branches/entities/branch.entity';

@Entity('ledger_entries')
export class LedgerEntry {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'branch_id' })
    branchId!: string;

    @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Column({ type: 'enum', enum: LedgerEntryType, name: 'entry_type' })
    entryType!: LedgerEntryType;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount!: number;

    @Column({ type: 'varchar' })
    description!: string;

    @Column({ type: 'varchar', name: 'reference_number' })
    referenceNumber!: string;

    @Column({ type: 'uuid', name: 'transaction_id', nullable: true })
    transactionId!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
