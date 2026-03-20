import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '@common/config/database.config';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { BranchesModule } from '@branches/branches.module';
import { ProductsModule } from '@products/products.module';
import { InventoryModule } from '@inventory/inventory.module';
import { PosModule } from '@pos/pos.module';
import { AccountingModule } from '@accounting/accounting.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Notification } from '@notifications/entities/notification.entity';
import { AdminSeedService } from '@common/seeds/admin-seed.service';

import appConfig from '@common/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([
      User,
      Branch,
      Product,
      Inventory,
      Transaction,
      TransactionItem,
      LedgerEntry,
      Expense,
      Notification,
    ]),
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    InventoryModule,
    PosModule,
    AccountingModule,
    NotificationsModule,
  ],
  providers: [AdminSeedService],
})
export class AppModule {}
