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
import { HeldSalesController } from '@pos/held-sales.controller';
import { HeldSalesService } from '@pos/held-sales.service';
import { HeldSalesRepository } from '@pos/held-sales.repository';
import { DiscountSchemesController } from '@pos/discount-schemes.controller';
import { DiscountSchemesService } from '@pos/discount-schemes.service';
import { DiscountSchemesRepository } from '@pos/discount-schemes.repository';
import { SalesReportsController } from '@pos/sales-reports.controller';
import { SalesReportsService } from '@pos/sales-reports.service';
import { SalesReportsRepository } from '@pos/sales-reports.repository';
import { PosShift } from '@pos/entities/pos-shift.entity';
import { PosCashMovement } from '@pos/entities/pos-cash-movement.entity';
import { HeldSale } from '@pos/entities/held-sale.entity';
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
import { EmailModule } from '@/modules/email/email.module';
import { CreditAccountsModule } from '@/modules/credit-accounts/credit-accounts.module';

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
      PosCashMovement,
      HeldSale,
      DiscountScheme,
    ]),
    AccountingModule,
    forwardRef(() => InventoryModule),
    ProductsModule,
    UsersModule,
    LoyaltyModule,
    EmailModule,
    CreditAccountsModule,
  ],
  controllers: [
    PosController,
    ReceivablesController,
    ShiftsController,
    HeldSalesController,
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
    HeldSalesService,
    HeldSalesRepository,
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
  // Public surface: services only (blaxx nestjs-07). Sibling modules read and
  // write sales through PosService pass-throughs (createAndSaveTransaction,
  // findByInvoiceNumber, findOneById); SaleRepository / PosRepository and the
  // per-entity repositories stay private to the module.
  // ReceivablesService is exported for the demo seed, which records a
  // real FIFO repayment so the statement/ledger land like production.
  exports: [PosService, ReceivablesService, PosWriteService, PosRepository],
})
export class PosModule {}
