import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service.js';
import { AccountingController } from './accounting.controller.js';
import { LedgerEntry } from './entities/ledger-entry.entity.js';
import { Expense } from './entities/expense.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([LedgerEntry, Expense])],
    controllers: [AccountingController],
    providers: [AccountingService],
    exports: [AccountingService],
})
export class AccountingModule { }
