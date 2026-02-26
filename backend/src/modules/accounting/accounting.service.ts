import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { CreateExpenseDto } from '@accounting/dto/create-expense.dto';

@Injectable()
export class AccountingService {
    constructor(
        @InjectRepository(LedgerEntry)
        private readonly ledgerRepository: Repository<LedgerEntry>,
        @InjectRepository(Expense)
        private readonly expenseRepository: Repository<Expense>,
    ) { }

    async getLedgerEntries(branchId: string): Promise<LedgerEntry[]> {
        return this.ledgerRepository.find({
            where: { branchId },
            order: { createdAt: 'DESC' },
        });
    }

    async createExpense(
        dto: CreateExpenseDto,
        createdBy: string,
    ): Promise<Expense> {
        const expense = this.expenseRepository.create({
            ...dto,
            createdBy,
        });
        return this.expenseRepository.save(expense);
    }

    async getExpenses(branchId: string): Promise<Expense[]> {
        return this.expenseRepository.find({
            where: { branchId },
            relations: ['creator'],
            order: { createdAt: 'DESC' },
        });
    }
}
