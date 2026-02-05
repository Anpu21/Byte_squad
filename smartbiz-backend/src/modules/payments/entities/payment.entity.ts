import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PaymentMode, PaymentStatus } from '@common/constants/accounting.enum';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    branchId: string;

    @Column()
    paymentNumber: string;

    @Column({ type: 'date' })
    paymentDate: Date;

    @Column({ type: 'text' })
    paymentMode: PaymentMode;

    @Column({ type: 'text', default: PaymentStatus.COMPLETED })
    status: PaymentStatus;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    // Party details
    @Column()
    partyLedgerId: string;

    @Column({ nullable: true })
    partyName: string;

    // Bank details (if bank/cheque payment)
    @Column({ nullable: true })
    bankName: string;

    @Column({ nullable: true })
    bankAccount: string;

    @Column({ nullable: true })
    chequeNumber: string;

    @Column({ type: 'date', nullable: true })
    chequeDate: Date;

    // UPI/QR details
    @Column({ nullable: true })
    transactionId: string;

    @Column({ nullable: true })
    upiId: string;

    // Reference to voucher/invoice
    @Column({ nullable: true })
    voucherId: string;

    @Column({ nullable: true })
    referenceType: string;

    @Column({ nullable: true })
    referenceNumber: string;

    @Column({ nullable: true })
    narration: string;

    @Column()
    createdBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
