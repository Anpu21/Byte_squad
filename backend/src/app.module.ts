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
import { InventoryCoreModule } from '@/modules/inventory-core/inventory-core.module';
import { InventoryExpiryModule } from '@/modules/inventory-expiry/inventory-expiry.module';
import { InventoryAdjustmentsModule } from '@/modules/inventory-adjustments/inventory-adjustments.module';
import { InventoryReturnsModule } from '@/modules/inventory-returns/inventory-returns.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { PosSalesModule } from '@/modules/pos-sales/pos-sales.module';
import { PosReceivablesModule } from '@/modules/pos-receivables/pos-receivables.module';
import { PosShiftsModule } from '@/modules/pos-shifts/pos-shifts.module';
import { PosDiscountsModule } from '@/modules/pos-discounts/pos-discounts.module';
import { PosReportsModule } from '@/modules/pos-reports/pos-reports.module';
import { AccountingCoreModule } from '@/modules/accounting-core/accounting-core.module';
import { AccountingPeriodsModule } from '@/modules/accounting-periods/accounting-periods.module';
import { AccountingReportsModule } from '@/modules/accounting-reports/accounting-reports.module';
import { AccountsRepository } from '@/modules/accounting-core/accounts.repository';
import { NotificationsModule } from '@notifications/notifications.module';
import { AdminPortalModule } from '@admin-portal/admin-portal.module';
import { BranchAnalyticsModule } from '@/modules/branch-analytics/branch-analytics.module';
import { StockTransfersModule } from '@stock-transfers/stock-transfers.module';
import { CustomerOrdersModule } from '@/modules/customer-orders/customer-orders.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { LoyaltySettingsModule } from '@/modules/loyalty-settings/loyalty-settings.module';
import { LoyaltyCustomersModule } from '@/modules/loyalty-customers/loyalty-customers.module';
import { LoyaltyWalletsModule } from '@/modules/loyalty-wallets/loyalty-wallets.module';
import { HrEmployeesModule } from '@/modules/hr-employees/hr-employees.module';
import { HrAttendanceModule } from '@/modules/hr-attendance/hr-attendance.module';
import { HrLeavesModule } from '@/modules/hr-leaves/hr-leaves.module';
import { HrSalaryStructuresModule } from '@/modules/hr-salary-structures/hr-salary-structures.module';
import { HrPayrollSettingsModule } from '@/modules/hr-payroll-settings/hr-payroll-settings.module';
import { HrPayrollModule } from '@/modules/hr-payroll/hr-payroll.module';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { PurchasesDocNumberingModule } from '@/modules/purchases-doc-numbering/purchases-doc-numbering.module';
import { PurchasesGrnModule } from '@/modules/purchases-grn/purchases-grn.module';
import { PurchasesOrdersModule } from '@/modules/purchases-orders/purchases-orders.module';
import { PurchasesPaymentsModule } from '@/modules/purchases-payments/purchases-payments.module';
import { PurchasesReturnsModule } from '@/modules/purchases-returns/purchases-returns.module';
import { PurchasesReportsModule } from '@/modules/purchases-reports/purchases-reports.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { Attendance } from '@/modules/hr-attendance/entities/attendance.entity';
import { AttendanceSummary } from '@/modules/hr-attendance/entities/attendance-summary.entity';
import { Employee } from '@/modules/hr-employees/entities/employee.entity';
import { EmployeeLeave } from '@/modules/hr-leaves/entities/employee-leave.entity';
import { Payroll } from '@/modules/hr-payroll/entities/payroll.entity';
import { PayrollSettings } from '@/modules/hr-payroll-settings/entities/payroll-settings.entity';
import { SalaryStructure } from '@/modules/hr-salary-structures/entities/salary-structure.entity';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { ProductBatch } from '@/modules/inventory-expiry/entities/product-batch.entity';
import { StockAdjustment } from '@/modules/inventory-adjustments/entities/stock-adjustment.entity';
import { SalesReturn } from '@/modules/inventory-returns/entities/sales-return.entity';
import { SalesReturnItem } from '@/modules/inventory-returns/entities/sales-return-item.entity';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { SaleItem } from '@/modules/pos-sales/entities/sale-item.entity';
import { StockMovement } from '@/modules/pos-sales/entities/stock-movement.entity';
import { Payment } from '@/modules/pos-sales/entities/payment.entity';
import { IdempotencyKey } from '@/modules/pos-sales/entities/idempotency-key.entity';
import { LedgerEntry } from '@/modules/accounting-core/entities/ledger-entry.entity';
import { Expense } from '@/modules/accounting-core/entities/expense.entity';
import { Notification } from '@notifications/entities/notification.entity';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Shipment } from '@stock-transfers/entities/shipment.entity';
import { ShipmentEvent } from '@stock-transfers/entities/shipment-event.entity';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { PayherePaymentAttempt } from '@/modules/customer-orders/entities/payhere-payment-attempt.entity';
import { LoyaltyAccount } from '@/modules/loyalty-wallets/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty-customers/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty-wallets/entities/loyalty-ledger-entry.entity';
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
    InventoryCoreModule,
    InventoryExpiryModule,
    InventoryAdjustmentsModule,
    InventoryReturnsModule,
    PosSalesModule,
    PosReceivablesModule,
    PosShiftsModule,
    PosDiscountsModule,
    PosReportsModule,
    AccountingCoreModule,
    AccountingPeriodsModule,
    AccountingReportsModule,
    NotificationsModule,
    AdminPortalModule,
    BranchAnalyticsModule,
    StockTransfersModule,
    CustomerOrdersModule,
    ShopModule,
    LoyaltySettingsModule,
    LoyaltyCustomersModule,
    LoyaltyWalletsModule,
    HrEmployeesModule,
    HrAttendanceModule,
    HrLeavesModule,
    HrSalaryStructuresModule,
    HrPayrollSettingsModule,
    HrPayrollModule,
    SuppliersModule,
    PurchasesDocNumberingModule,
    PurchasesGrnModule,
    PurchasesOrdersModule,
    PurchasesPaymentsModule,
    PurchasesReturnsModule,
    PurchasesReportsModule,
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
