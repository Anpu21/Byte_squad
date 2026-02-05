import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { VoucherType } from '@common/constants/accounting.enum';
import { VoucherEntry } from './voucher-entry.entity';

@Entity('vouchers')
export class Voucher {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    voucherNumber: string;

    @Column({ type: 'text' })
    voucherType: VoucherType;

    @Column({ type: 'date' })
    voucherDate: Date;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    branchId: string;

    @Column({ nullable: true })
    narration: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    totalAmount: number;

    @Column({ default: false })
    isPosted: boolean;

    @Column({ default: false })
    isVoided: boolean;

    @Column({ nullable: true })
    voidedAt: Date;

    @Column({ nullable: true })
    voidReason: string;

    // Reference for linked documents
    @Column({ nullable: true })
    referenceNumber: string;

    @Column({ nullable: true })
    referenceType: string;

    @Column({ nullable: true })
    referenceId: string;

    @OneToMany(() => VoucherEntry, (entry) => entry.voucher, {
        cascade: true,
        eager: true,
    })
    entries: VoucherEntry[];

    @Column()
    createdBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
