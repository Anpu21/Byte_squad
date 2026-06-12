import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from '@pos/pos.service';
import { PosWriteService } from '@pos/pos-write.service';
import { PosVoidService } from '@pos/pos-void.service';
import { PosController } from '@pos/pos.controller';
import { ReceivablesController } from '@pos/receivables.controller';
import { ReceivablesService } from '@pos/receivables.service';
import { ShiftsController } from '@pos/shifts.controller';
import { ShiftsService } from '@pos/shifts.service';
import { ShiftsRepository } from '@pos/shifts.repository';
import { DiscountSchemesController } from '@pos/discount-schemes.controller';
import { DiscountSchemesService } from '@pos/discount-schemes.service';
import { DiscountSchemesRepository } from '@pos/discount-schemes.repository';
import { SalesReportsController } from '@pos/sales-reports.controller';
import { SalesReportsService } from '@pos/sales-reports.service';
import { SalesReportsRepository } from '@pos/sales-reports.repository';
import { PosShift } from '@pos/entities/pos-shift.entity';
import { DiscountScheme } from '@pos/entities/discount-scheme.entity';
import { PosRepository } from '@pos/pos.repository';
import { SaleRepository } from '@pos/sale.repository';
import { SaleItemRepository } from '@pos/sale-item.repository';
import { PaymentRepository } from '@pos/payment.repository';
import { CreditTransactionRepository } from '@pos/credit-transaction.repository';
import { StockMovementRepository } from '@pos/stock-movement.repository';
import { MultiTenderCalculatorService } from '@pos/services/multi-tender-calculator.service';
import { InvoiceNumberService } from '@pos/services/invoice-number.service';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { Payment } from '@pos/entities/payment.entity';
import { CreditTransaction } from '@pos/entities/credit-transaction.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import { InvoiceCounter } from '@pos/entities/invoice-counter.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { AccountingModule } from '@accounting/accounting.module';
import { InventoryModule } from '@inventory/inventory.module';
import { ProductsModule } from '@products/products.module';
import { UsersModule } from '@users/users.module';
import { LoyaltyModule } from '@/modules/loyalty/loyalty.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      Payment,
      CreditTransaction,
      StockMovement,
      InvoiceCounter,
      IdempotencyKey,
      PosShift,
      DiscountScheme,
    ]),
    AccountingModule,
    forwardRef(() => InventoryModule),
    ProductsModule,
    UsersModule,
    LoyaltyModule,
  ],
  controllers: [
    PosController,
    ReceivablesController,
    ShiftsController,
    DiscountSchemesController,
    SalesReportsController,
  ],
  providers: [
    PosService,
    PosWriteService,
    PosVoidService,
    ReceivablesService,
    ShiftsService,
    ShiftsRepository,
    DiscountSchemesService,
    DiscountSchemesRepository,
    SalesReportsService,
    SalesReportsRepository,
    PosRepository,
    SaleRepository,
    SaleItemRepository,
    PaymentRepository,
    CreditTransactionRepository,
    StockMovementRepository,
    MultiTenderCalculatorService,
    InvoiceNumberService,
  ],
  // Public surface: the service for write/read operations and the
  // SaleRepository for accounting joins. PosRepository is still exported
  // for now because customer-orders.service consumes it directly; it
  // will be replaced with the per-entity repositories in Phase 5 and
  // dropped from exports then. New per-entity repositories
  // (SaleItem, Payment, CreditTransaction, StockMovement) stay private
  // to the module.
  // ReceivablesService is exported for the demo seed, which records a
  // real FIFO repayment so the statement/ledger land like production.
  exports: [PosService, SaleRepository, PosRepository, ReceivablesService],
})
export class PosModule {}
