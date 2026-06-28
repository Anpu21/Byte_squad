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
import { CategoriesModule } from '@/modules/categories/categories.module';
import { BrandsModule } from '@/modules/brands/brands.module';
import { PosModule } from '@pos/pos.module';
import { AccountingModule } from '@accounting/accounting.module';
import { AccountsRepository } from '@accounting/accounts.repository';
import { NotificationsModule } from '@notifications/notifications.module';
import { AdminPortalModule } from '@admin-portal/admin-portal.module';
import { BranchAnalyticsModule } from '@/modules/branch-analytics/branch-analytics.module';
import { StockTransfersModule } from '@stock-transfers/stock-transfers.module';
import { CustomerOrdersModule } from '@/modules/customer-orders/customer-orders.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';
import { LoyaltyModule } from '@/modules/loyalty/loyalty.module';
import { HrModule } from '@/modules/hr/hr.module';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { PurchasesModule } from '@/modules/purchases/purchases.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { Attendance } from '@/modules/hr/entities/attendance.entity';
import { AttendanceSummary } from '@/modules/hr/entities/attendance-summary.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { EmployeeLeave } from '@/modules/hr/entities/employee-leave.entity';
import { Payroll } from '@/modules/hr/entities/payroll.entity';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';
import { SalaryStructure } from '@/modules/hr/entities/salary-structure.entity';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountTransaction } from '@/modules/credit-accounts/entities/credit-account-transaction.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { ProductBatch } from '@inventory/entities/product-batch.entity';
import { StockAdjustment } from '@inventory/entities/stock-adjustment.entity';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { SalesReturnItem } from '@inventory/entities/sales-return-item.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import { Payment } from '@pos/entities/payment.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Notification } from '@notifications/entities/notification.entity';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Shipment } from '@stock-transfers/entities/shipment.entity';
import { ShipmentEvent } from '@stock-transfers/entities/shipment-event.entity';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { PayherePaymentAttempt } from '@/modules/customer-orders/entities/payhere-payment-attempt.entity';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { AdminSeedService } from '@common/seeds/admin-seed.service';
import { HrSeedService } from '@common/seeds/hr-seed.service';
import { PurchasesSeedService } from '@common/seeds/purchases-seed.service';
import { PosAccountingSeedService } from '@common/seeds/pos-accounting-seed.service';
import { CloudinaryModule } from '@common/cloudinary/cloudinary.module';

import appConfig from '@common/config/app.config';
import { validateEnv } from '@common/config/env.validation';
import { HealthModule } from '@common/health/health.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    // Global rate limit: 300 requests / minute / IP (DoS protection). Auth
    // routes set a stricter per-route limit; /health skips throttling.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([
      User,
      Branch,
      Product,
      Category,
      Brand,
      CreditAccount,
      CreditAccountTransaction,
      ProductSellableUnit,
      Inventory,
      ProductBatch,
      StockAdjustment,
      SalesReturn,
      SalesReturnItem,
      Sale,
      SaleItem,
      StockMovement,
      Payment,
      IdempotencyKey,
      LedgerEntry,
      Expense,
      Notification,
      StockTransferRequest,
      Shipment,
      ShipmentEvent,
      CustomerOrder,
      CustomerOrderItem,
      PayherePaymentAttempt,
      LoyaltyAccount,
      LoyaltyCustomer,
      LoyaltyLedgerEntry,
      Employee,
      SalaryStructure,
      Attendance,
      AttendanceSummary,
      EmployeeLeave,
      Payroll,
      PayrollSettings,
    ]),
    HealthModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    InventoryModule,
    PosModule,
    AccountingModule,
    NotificationsModule,
    AdminPortalModule,
    BranchAnalyticsModule,
    StockTransfersModule,
    CustomerOrdersModule,
    ShopModule,
    ReviewsModule,
    LoyaltyModule,
    HrModule,
    SuppliersModule,
    PurchasesModule,
    AuditModule,
  ],
  providers: [
    // AccountsRepository (DataSource-only) is provided at the composition root
    // so the bootstrap seeders can use it without AccountingModule exporting
    // its repository (blaxx nestjs-07 — modules export only services).
    AccountsRepository,
    AdminSeedService,
    HrSeedService,
    PurchasesSeedService,
    PosAccountingSeedService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
