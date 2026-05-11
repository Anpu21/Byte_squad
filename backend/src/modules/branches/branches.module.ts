import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesService } from '@branches/branches.service';
import { BranchesController } from '@branches/branches.controller';
import { BranchesRepository } from '@branches/branches.repository';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      User,
      Transaction,
      TransactionItem,
      Inventory,
      Expense,
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService, BranchesRepository],
  exports: [BranchesService, BranchesRepository],
})
export class BranchesModule {}
