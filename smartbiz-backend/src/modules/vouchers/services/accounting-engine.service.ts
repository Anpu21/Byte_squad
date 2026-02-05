import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Voucher } from '../entities/voucher.entity';
import { VoucherEntry } from '../entities/voucher-entry.entity';
import { Ledger } from '@modules/ledgers/entities/ledger.entity';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { VoucherType, BalanceType } from '@common/constants/accounting.enum';
import { v4 as uuidv4 } from 'uuid';

/**
 * Double-Entry Accounting Engine
 * 
 * RULES ENFORCED:
 * 1. Total Debits MUST equal Total Credits
 * 2. Transaction rollback on any mismatch
 * 3. Vouchers are immutable after posting
 * 4. Opening balances carry forward
 * 5. Ledger balances updated in real-time
 */
@Injectable()
export class AccountingEngineService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Voucher)
        private readonly voucherRepository: Repository<Voucher>,
        @InjectRepository(VoucherEntry)
        private readonly entryRepository: Repository<VoucherEntry>,
        @InjectRepository(Ledger)
        private readonly ledgerRepository: Repository<Ledger>,
    ) { }

    /**
     * Create a voucher with strict double-entry validation
     */
    async createVoucher(
        dto: CreateVoucherDto,
        userId: string,
    ): Promise<Voucher> {
        // Step 1: Validate debit = credit (CRITICAL)
        this.validateDoubleEntry(dto.entries);

        // Step 2: Execute in transaction for rollback safety
        return this.dataSource.transaction(async (manager) => {
            // Generate voucher number
            const voucherNumber = await this.generateVoucherNumber(
                manager,
                dto.companyId,
                dto.voucherType,
            );

            // Create voucher
            const voucher = manager.create(Voucher, {
                id: uuidv4(),
                voucherNumber,
                voucherType: dto.voucherType,
                voucherDate: dto.voucherDate,
                companyId: dto.companyId,
                branchId: dto.branchId,
                narration: dto.narration,
                totalAmount: this.calculateTotal(dto.entries),
                referenceNumber: dto.referenceNumber,
                createdBy: userId,
                isPosted: false,
            });

            const savedVoucher = await manager.save(Voucher, voucher);

            // Create entries
            const entries: VoucherEntry[] = [];
            for (let i = 0; i < dto.entries.length; i++) {
                const entryDto = dto.entries[i];

                const entry = manager.create(VoucherEntry, {
                    id: uuidv4(),
                    voucherId: savedVoucher.id,
                    ledgerId: entryDto.ledgerId,
                    debitAmount: entryDto.debitAmount || 0,
                    creditAmount: entryDto.creditAmount || 0,
                    narration: entryDto.narration,
                    itemId: entryDto.itemId,
                    quantity: entryDto.quantity,
                    rate: entryDto.rate,
                    sortOrder: i,
                });

                entries.push(await manager.save(VoucherEntry, entry));
            }

            savedVoucher.entries = entries;
            return savedVoucher;
        });
    }

    /**
     * Post a voucher - updates ledger balances (IMMUTABLE after this)
     */
    async postVoucher(voucherId: string): Promise<Voucher> {
        return this.dataSource.transaction(async (manager) => {
            const voucher = await manager.findOne(Voucher, {
                where: { id: voucherId },
                relations: ['entries', 'entries.ledger'],
            });

            if (!voucher) {
                throw new BadRequestException('Voucher not found');
            }

            if (voucher.isPosted) {
                throw new BadRequestException('Voucher is already posted');
            }

            if (voucher.isVoided) {
                throw new BadRequestException('Cannot post a voided voucher');
            }

            // Re-validate double entry before posting
            this.validateDoubleEntryFromEntries(voucher.entries);

            // Update ledger balances
            for (const entry of voucher.entries) {
                await this.updateLedgerBalance(manager, entry);
            }

            // Mark as posted
            voucher.isPosted = true;
            return manager.save(Voucher, voucher);
        });
    }

    /**
     * Void a voucher - reverses ledger balances
     */
    async voidVoucher(voucherId: string, reason: string): Promise<Voucher> {
        return this.dataSource.transaction(async (manager) => {
            const voucher = await manager.findOne(Voucher, {
                where: { id: voucherId },
                relations: ['entries'],
            });

            if (!voucher) {
                throw new BadRequestException('Voucher not found');
            }

            if (voucher.isVoided) {
                throw new BadRequestException('Voucher is already voided');
            }

            // If posted, reverse the ledger balances
            if (voucher.isPosted) {
                for (const entry of voucher.entries) {
                    await this.reverseLedgerBalance(manager, entry);
                }
            }

            voucher.isVoided = true;
            voucher.voidedAt = new Date();
            voucher.voidReason = reason;

            return manager.save(Voucher, voucher);
        });
    }

    /**
     * Validate double-entry rule: Total Debit MUST equal Total Credit
     */
    private validateDoubleEntry(entries: { debitAmount?: number; creditAmount?: number }[]): void {
        const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debitAmount) || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (Number(e.creditAmount) || 0), 0);

        // Use precision comparison to handle floating point
        const diff = Math.abs(totalDebit - totalCredit);
        if (diff > 0.01) {
            throw new BadRequestException(
                `Double-entry violation: Debit (${totalDebit.toFixed(2)}) must equal Credit (${totalCredit.toFixed(2)}). Difference: ${diff.toFixed(2)}`,
            );
        }

        if (totalDebit === 0 && totalCredit === 0) {
            throw new BadRequestException('Voucher must have at least one entry with an amount');
        }
    }

    private validateDoubleEntryFromEntries(entries: VoucherEntry[]): void {
        this.validateDoubleEntry(
            entries.map((e) => ({ debitAmount: e.debitAmount, creditAmount: e.creditAmount })),
        );
    }

    /**
     * Update ledger balance based on entry
     */
    private async updateLedgerBalance(
        manager: EntityManager,
        entry: VoucherEntry,
    ): Promise<void> {
        const ledger = await manager.findOne(Ledger, {
            where: { id: entry.ledgerId },
        });

        if (!ledger) {
            throw new BadRequestException(`Ledger ${entry.ledgerId} not found`);
        }

        // Calculate new balance based on account type
        const newBalance = this.calculateNewBalance(
            ledger,
            Number(entry.debitAmount) || 0,
            Number(entry.creditAmount) || 0,
        );

        await manager.update(Ledger, ledger.id, {
            currentBalance: Math.abs(newBalance),
            currentBalanceType: newBalance >= 0 ? BalanceType.DEBIT : BalanceType.CREDIT,
        });
    }

    /**
     * Reverse ledger balance (for voiding)
     */
    private async reverseLedgerBalance(
        manager: EntityManager,
        entry: VoucherEntry,
    ): Promise<void> {
        // Swap debit and credit to reverse
        const reversedEntry = {
            ...entry,
            debitAmount: entry.creditAmount,
            creditAmount: entry.debitAmount,
        };
        await this.updateLedgerBalance(manager, reversedEntry as VoucherEntry);
    }

    /**
     * Calculate new ledger balance based on group type
     * ASSET/EXPENSE: increase with DEBIT, decrease with CREDIT
     * LIABILITY/INCOME/EQUITY: increase with CREDIT, decrease with DEBIT
     */
    private calculateNewBalance(
        ledger: Ledger,
        debit: number,
        credit: number,
    ): number {
        const currentBalance =
            ledger.currentBalanceType === BalanceType.DEBIT
                ? Number(ledger.currentBalance)
                : -Number(ledger.currentBalance);

        const isDebitPositive = ['ASSET', 'EXPENSE'].includes(ledger.groupType);

        if (isDebitPositive) {
            return currentBalance + debit - credit;
        } else {
            return currentBalance - debit + credit;
        }
    }

    private calculateTotal(entries: { debitAmount?: number }[]): number {
        return entries.reduce((sum, e) => sum + (Number(e.debitAmount) || 0), 0);
    }

    private async generateVoucherNumber(
        manager: EntityManager,
        companyId: string,
        voucherType: VoucherType,
    ): Promise<string> {
        const prefix = this.getVoucherPrefix(voucherType);
        const count = await manager.count(Voucher, {
            where: { companyId, voucherType },
        });

        return `${prefix}-${String(count + 1).padStart(6, '0')}`;
    }

    private getVoucherPrefix(type: VoucherType): string {
        const prefixes: Record<VoucherType, string> = {
            [VoucherType.RECEIPT]: 'RCP',
            [VoucherType.PAYMENT]: 'PAY',
            [VoucherType.JOURNAL]: 'JRN',
            [VoucherType.CONTRA]: 'CTR',
            [VoucherType.SALES]: 'SLS',
            [VoucherType.PURCHASE]: 'PUR',
            [VoucherType.DEBIT_NOTE]: 'DBN',
            [VoucherType.CREDIT_NOTE]: 'CRN',
        };
        return prefixes[type] || 'VCH';
    }
}
