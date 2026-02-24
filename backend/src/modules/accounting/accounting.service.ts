import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity.js';
import { Expense } from './entities/expense.entity.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';

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
