import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesService } from '@branches/branches.service';
import { BranchesController } from '@branches/branches.controller';
import { BranchesRepository } from '@branches/branches.repository';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';

@Module({
  // NOTE: do not import UsersModule here. UsersModule already imports
  // BranchesModule (for UsersService.updateMyBranch), so adding it back would
  // re-create a circular module dependency that crashes Nest's scanner at
  // boot. If BranchesService needs to look up a User, use the injected
  // userRepository directly.
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      User,
      Sale,
      SaleItem,
      Inventory,
      Expense,
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService, BranchesRepository],
  exports: [BranchesService, BranchesRepository],
})
export class BranchesModule {}
