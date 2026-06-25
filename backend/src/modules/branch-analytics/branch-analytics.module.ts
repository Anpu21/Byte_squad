import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { Expense } from '@/modules/accounting-core/entities/expense.entity';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { LoyaltyAccount } from '@/modules/loyalty-wallets/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty-wallets/entities/loyalty-ledger-entry.entity';
import { LoyaltySettingsModule } from '@/modules/loyalty-settings/loyalty-settings.module';
import { Payment } from '@pos/entities/payment.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { User } from '@users/entities/user.entity';
import { BranchAnalyticsController } from './branch-analytics.controller';
import { BranchAnalyticsRepository } from './branch-analytics.repository';
import { BranchAnalyticsService } from './branch-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      CustomerOrder,
      Expense,
      Inventory,
      LoyaltyAccount,
      LoyaltyLedgerEntry,
      Payment,
      Sale,
      SaleItem,
      User,
    ]),
    LoyaltySettingsModule,
  ],
  controllers: [BranchAnalyticsController],
  providers: [BranchAnalyticsRepository, BranchAnalyticsService],
})
export class BranchAnalyticsModule {}
