import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from '@common/config/database.config';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { BranchesModule } from '@branches/branches.module';
import { ProductsModule } from '@products/products.module';
import { InventoryModule } from '@inventory/inventory.module';
import { PosModule } from '@pos/pos.module';
import { AccountingModule } from '@accounting/accounting.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { AdminPortalModule } from '@admin-portal/admin-portal.module';
import { StockTransfersModule } from '@stock-transfers/stock-transfers.module';
import { CustomerOrdersModule } from '@/modules/customer-orders/customer-orders.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { LoyaltyModule } from '@/modules/loyalty/loyalty.module';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Notification } from '@notifications/entities/notification.entity';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { PayherePaymentAttempt } from '@/modules/customer-orders/entities/payhere-payment-attempt.entity';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { AdminSeedService } from '@common/seeds/admin-seed.service';
import { CloudinaryModule } from '@common/cloudinary/cloudinary.module';

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
      ProductSellableUnit,
      Inventory,
      Sale,
      SaleItem,
      IdempotencyKey,
      LedgerEntry,
      Expense,
      Notification,
      StockTransferRequest,
      CustomerOrder,
      CustomerOrderItem,
      PayherePaymentAttempt,
      LoyaltyAccount,
      LoyaltyCustomer,
      LoyaltyLedgerEntry,
    ]),
    CloudinaryModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    InventoryModule,
    PosModule,
    AccountingModule,
    NotificationsModule,
    AdminPortalModule,
    StockTransfersModule,
    CustomerOrdersModule,
    ShopModule,
    LoyaltyModule,
  ],
  providers: [AdminSeedService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
