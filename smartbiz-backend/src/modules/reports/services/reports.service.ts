import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ledger } from '@modules/ledgers/entities/ledger.entity';
import { Voucher } from '@modules/vouchers/entities/voucher.entity';
import { VoucherEntry } from '@modules/vouchers/entities/voucher-entry.entity';
import { LedgerGroupType } from '@common/constants/accounting.enum';

export interface TrialBalanceItem {
    ledgerId: string;
    ledgerName: string;
    groupType: LedgerGroupType;
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
}

export interface ProfitLossReport {
    income: { name: string; amount: number }[];
    expenses: { name: string; amount: number }[];
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
}

export interface BalanceSheetReport {
    assets: { name: string; amount: number }[];
    liabilities: { name: string; amount: number }[];
    equity: { name: string; amount: number }[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
}

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Ledger)
        private readonly ledgerRepository: Repository<Ledger>,
        @InjectRepository(VoucherEntry)
        private readonly entryRepository: Repository<VoucherEntry>,
        @InjectRepository(Voucher)
        private readonly voucherRepository: Repository<Voucher>,
    ) { }

    async getTrialBalance(
        companyId: string,
        fromDate: Date,
        toDate: Date,
    ): Promise<TrialBalanceItem[]> {
        const ledgers = await this.ledgerRepository.find({
            where: { companyId, isActive: true },
            order: { groupType: 'ASC', name: 'ASC' },
        });

        const result: TrialBalanceItem[] = [];

        for (const ledger of ledgers) {
            // Get period transactions
            const periodEntries = await this.entryRepository
                .createQueryBuilder('entry')
                .innerJoin('entry.voucher', 'voucher')
                .where('entry.ledgerId = :ledgerId', { ledgerId: ledger.id })
                .andWhere('voucher.isPosted = :isPosted', { isPosted: true })
                .andWhere('voucher.isVoided = :isVoided', { isVoided: false })
                .andWhere('voucher.voucherDate BETWEEN :fromDate AND :toDate', {
                    fromDate,
                    toDate,
                })
                .select([
                    'SUM(entry.debitAmount) as totalDebit',
                    'SUM(entry.creditAmount) as totalCredit',
                ])
                .getRawOne();

            const openingDebit =
                ledger.openingBalanceType === 'DR'
                    ? Number(ledger.openingBalance)
                    : 0;
            const openingCredit =
                ledger.openingBalanceType === 'CR'
                    ? Number(ledger.openingBalance)
                    : 0;
            const periodDebit = Number(periodEntries?.totalDebit || 0);
            const periodCredit = Number(periodEntries?.totalCredit || 0);

            const closingBalance =
                openingDebit - openingCredit + periodDebit - periodCredit;

            result.push({
                ledgerId: ledger.id,
                ledgerName: ledger.name,
                groupType: ledger.groupType,
                openingDebit,
                openingCredit,
                periodDebit,
                periodCredit,
                closingDebit: closingBalance >= 0 ? closingBalance : 0,
                closingCredit: closingBalance < 0 ? Math.abs(closingBalance) : 0,
            });
        }

        return result;
    }

    async getProfitAndLoss(
        companyId: string,
        fromDate: Date,
        toDate: Date,
    ): Promise<ProfitLossReport> {
        const trialBalance = await this.getTrialBalance(companyId, fromDate, toDate);

        const income = trialBalance
            .filter((item) => item.groupType === LedgerGroupType.INCOME)
            .map((item) => ({
                name: item.ledgerName,
                amount: item.closingCredit - item.closingDebit,
            }))
            .filter((item) => item.amount !== 0);

        const expenses = trialBalance
            .filter((item) => item.groupType === LedgerGroupType.EXPENSE)
            .map((item) => ({
                name: item.ledgerName,
                amount: item.closingDebit - item.closingCredit,
            }))
            .filter((item) => item.amount !== 0);

        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

        return {
            income,
            expenses,
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
        };
    }

    async getBalanceSheet(
        companyId: string,
        asOfDate: Date,
    ): Promise<BalanceSheetReport> {
        const fromDate = new Date('1900-01-01'); // Beginning of time
        const trialBalance = await this.getTrialBalance(companyId, fromDate, asOfDate);

        const assets = trialBalance
            .filter((item) => item.groupType === LedgerGroupType.ASSET)
            .map((item) => ({
                name: item.ledgerName,
                amount: item.closingDebit - item.closingCredit,
            }))
            .filter((item) => item.amount !== 0);

        const liabilities = trialBalance
            .filter((item) => item.groupType === LedgerGroupType.LIABILITY)
            .map((item) => ({
                name: item.ledgerName,
                amount: item.closingCredit - item.closingDebit,
            }))
            .filter((item) => item.amount !== 0);

        const equity = trialBalance
            .filter((item) => item.groupType === LedgerGroupType.EQUITY)
            .map((item) => ({
                name: item.ledgerName,
                amount: item.closingCredit - item.closingDebit,
            }))
            .filter((item) => item.amount !== 0);

        return {
            assets,
            liabilities,
            equity,
            totalAssets: assets.reduce((sum, item) => sum + item.amount, 0),
            totalLiabilities: liabilities.reduce((sum, item) => sum + item.amount, 0),
            totalEquity: equity.reduce((sum, item) => sum + item.amount, 0),
        };
    }
}
