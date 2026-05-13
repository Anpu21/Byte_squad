import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesService } from '@branches/branches.service';
import { BranchesController } from '@branches/branches.controller';
import { BranchesRepository } from '@branches/branches.repository';
import { PendingBranchActionsRepository } from '@branches/pending-branch-actions.repository';
import { Branch } from '@branches/entities/branch.entity';
import { PendingBranchAction } from '@branches/entities/pending-branch-action.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { EmailModule } from '@/modules/email/email.module';

@Module({
  // NOTE: do not import UsersModule here. UsersModule already imports
  // BranchesModule (for UsersService.updateMyBranch), so adding it back would
  // re-create a circular module dependency that crashes Nest's scanner at
  // boot. If BranchesService needs to look up a User, use the injected
  // userRepository directly.
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      PendingBranchAction,
      User,
      Transaction,
      TransactionItem,
      Inventory,
      Expense,
    ]),
    EmailModule,
  ],
  controllers: [BranchesController],
  providers: [
    BranchesService,
    BranchesRepository,
    PendingBranchActionsRepository,
  ],
  exports: [BranchesService, BranchesRepository],
})
export class BranchesModule {}
