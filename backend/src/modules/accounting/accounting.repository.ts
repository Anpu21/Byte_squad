import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeepPartial, Repository } from 'typeorm';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';

import {
  ListLedgerOptions,
  PagedLedger,
  LedgerSummaryRaw,
  ListExpenseOptions,
} from '@accounting/types';

@Injectable()
export class AccountingRepository {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async createLedgerEntry(
    partial: DeepPartial<LedgerEntry>,
  ): Promise<LedgerEntry> {
    return this.ledgerRepo.save(this.ledgerRepo.create(partial));
  }

  async deleteLedgerByReference(referenceNumber: string): Promise<void> {
    await this.ledgerRepo.delete({ referenceNumber });
  }

  async listLedger(opts: ListLedgerOptions): Promise<PagedLedger> {
    const qb = this.ledgerRepo.createQueryBuilder('le');
    if (opts.branchId !== null) {
      qb.where('le.branch_id = :branchId', { branchId: opts.branchId });
    }

    if (opts.entryType && opts.entryType !== 'all') {
      qb.andWhere('le.entry_type = :entryType', { entryType: opts.entryType });
    }
    if (opts.startDate) {
      const start = new Date(opts.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('le.created_at >= :start', { start });
    }
    if (opts.endDate) {
      const end = new Date(opts.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('le.created_at <= :end', { end });
    }
    if (opts.search) {
      qb.andWhere(
        '(le.description ILIKE :search OR le.reference_number ILIKE :search)',
        { search: `%${opts.search}%` },
      );
    }

    qb.orderBy('le.created_at', 'DESC');
    const [items, total] = await qb
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getManyAndCount();

    return {
      items,
      total,
      page: opts.page,
      limit: opts.limit,
      totalPages: Math.ceil(total / opts.limit),
    };
  }

  async getLedgerSummary(branchId: string | null): Promise<LedgerSummaryRaw> {
    const qb = this.ledgerRepo
      .createQueryBuilder('le')
      .select(
        `SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount ELSE 0 END)`,
        'totalCredits',
      )
      .addSelect(
        `SUM(CASE WHEN le.entry_type = 'debit' THEN le.amount ELSE 0 END)`,
        'totalDebits',
      )
      .addSelect('COUNT(*)', 'entryCount');
    if (branchId !== null) {
      qb.where('le.branch_id = :branchId', { branchId });
    }
    const result = await qb.getRawOne<{
      totalCredits: string | null;
      totalDebits: string | null;
      entryCount: string;
    }>();

    return {
      totalCredits: Number(result?.totalCredits ?? 0),
      totalDebits: Number(result?.totalDebits ?? 0),
      entryCount: Number(result?.entryCount ?? 0),
    };
  }

  async createExpense(partial: DeepPartial<Expense>): Promise<Expense> {
    return this.expenseRepo.save(this.expenseRepo.create(partial));
  }

  async saveExpense(expense: Expense): Promise<Expense> {
    return this.expenseRepo.save(expense);
  }

  async findExpenseById(id: string): Promise<Expense | null> {
    return this.expenseRepo.findOne({ where: { id } });
  }

  async deleteExpense(id: string): Promise<void> {
    await this.expenseRepo.delete(id);
  }

  async listExpenses(opts: ListExpenseOptions): Promise<Expense[]> {
    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.creator', 'creator')
      .leftJoinAndSelect('expense.reviewer', 'reviewer')
      .leftJoinAndSelect('expense.branch', 'branch')
      .orderBy('expense.created_at', 'DESC');

    if (opts.branchId) {
      qb.andWhere('expense.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.status) {
      qb.andWhere('expense.status = :status', { status: opts.status });
    }
    if (opts.search) {
      qb.andWhere(
        '(expense.description ILIKE :search OR expense.category ILIKE :search)',
        { search: `%${opts.search}%` },
      );
    }
    return qb.getMany();
  }

  async findExpensesInRange(
    branchId: string | null,
    start: Date,
    end: Date,
  ): Promise<Expense[]> {
    return this.expenseRepo.find({
      where:
        branchId !== null
          ? { branchId, expenseDate: Between(start, end) }
          : { expenseDate: Between(start, end) },
    });
  }
}
