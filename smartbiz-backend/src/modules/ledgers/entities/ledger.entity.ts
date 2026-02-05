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
import { LedgerGroup } from './ledger-group.entity';
import { LedgerGroupType, BalanceType } from '@common/constants/accounting.enum';
import { VoucherEntry } from '@modules/vouchers/entities/voucher-entry.entity';

@Entity('ledgers')
export class Ledger {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    code: string;

    @Column()
    name: string;

    @Column()
    companyId: string;

    @Column()
    groupId: string;

    @ManyToOne(() => LedgerGroup)
    @JoinColumn({ name: 'groupId' })
    group: LedgerGroup;

    @Column({ type: 'text' })
    groupType: LedgerGroupType;

    @Column({ nullable: true })
    parentId: string;

    @ManyToOne(() => Ledger, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent: Ledger;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    openingBalance: number;

    @Column({ type: 'text', default: BalanceType.DEBIT })
    openingBalanceType: BalanceType;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    currentBalance: number;

    @Column({ type: 'text', default: BalanceType.DEBIT })
    currentBalanceType: BalanceType;

    // Contact details for receivable/payable ledgers
    @Column({ nullable: true })
    contactName: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    // Credit settings
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    creditLimit: number;

    @Column({ type: 'integer', default: 0 })
    creditDays: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isSystem: boolean; // System ledgers cannot be deleted

    @OneToMany(() => VoucherEntry, (entry) => entry.ledger)
    entries: VoucherEntry[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
