import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPortalController } from '@admin-portal/admin-portal.controller';
import { AdminPortalService } from '@admin-portal/admin-portal.service';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Product } from '@products/entities/product.entity';
import { Expense } from '@accounting/entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      User,
      Transaction,
      TransactionItem,
      Inventory,
      Product,
      Expense,
    ]),
  ],
  controllers: [AdminPortalController],
  providers: [AdminPortalService],
})
export class AdminPortalModule {}
