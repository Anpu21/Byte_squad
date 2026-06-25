import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { SaleItem } from '@/modules/pos-sales/entities/sale-item.entity';
import { Payment } from '@/modules/pos-sales/entities/payment.entity';
import { CreditTransaction } from '@/modules/pos-sales/entities/credit-transaction.entity';
import { StockMovement } from '@/modules/pos-sales/entities/stock-movement.entity';
import { InvoiceCounter } from '@/modules/pos-sales/entities/invoice-counter.entity';
import { IdempotencyKey } from '@/modules/pos-sales/entities/idempotency-key.entity';
import { PosController } from '@/modules/pos-sales/pos.controller';
import { PosService } from '@/modules/pos-sales/pos.service';
import { PosWriteService } from '@/modules/pos-sales/pos-write.service';
import { PosVoidService } from '@/modules/pos-sales/pos-void.service';
import { PosRepository } from '@/modules/pos-sales/pos.repository';
import { SaleRepository } from '@/modules/pos-sales/sale.repository';
import { SaleItemRepository } from '@/modules/pos-sales/sale-item.repository';
import { PaymentRepository } from '@/modules/pos-sales/payment.repository';
import { CreditTransactionRepository } from '@/modules/pos-sales/credit-transaction.repository';
import { StockMovementRepository } from '@/modules/pos-sales/stock-movement.repository';
import { InvoiceNumberService } from '@/modules/pos-sales/services/invoice-number.service';
import { MultiTenderCalculatorService } from '@/modules/pos-sales/services/multi-tender-calculator.service';
import { AccountingCoreModule } from '@/modules/accounting-core/accounting-core.module';
import { InventoryCoreModule } from '@/modules/inventory-core/inventory-core.module';
import { ProductsModule } from '@products/products.module';
import { UsersModule } from '@users/users.module';
import { LoyaltyWalletsModule } from '@/modules/loyalty-wallets/loyalty-wallets.module';

/**
 * POS sales core — checkout (PosWriteService), void/refund (PosVoidService),
 * and the read surface (PosService dashboards, product/customer search). Owns
 * the sale, payment, credit-transaction, stock-movement, invoice-counter, and
 * idempotency-key tables. Sibling pos-* modules and external consumers read and
 * write sales through the exported PosService; the per-entity repositories stay
 * private to this module.
 */
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
    ]),
    AccountingCoreModule,
    InventoryCoreModule,
    ProductsModule,
    UsersModule,
    LoyaltyWalletsModule,
  ],
  controllers: [PosController],
  providers: [
    PosService,
    PosWriteService,
    PosVoidService,
    PosRepository,
    SaleRepository,
    SaleItemRepository,
    PaymentRepository,
    CreditTransactionRepository,
    StockMovementRepository,
    InvoiceNumberService,
    MultiTenderCalculatorService,
  ],
  exports: [PosService],
})
export class PosSalesModule {}
