import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from '@inventory/inventory.service';
import { InventoryController } from '@inventory/inventory.controller';
import { InventoryRepository } from '@inventory/inventory.repository';
import { Inventory } from '@inventory/entities/inventory.entity';
import { ProductBatch } from '@inventory/entities/product-batch.entity';
import { StockAdjustment } from '@inventory/entities/stock-adjustment.entity';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { SalesReturnItem } from '@inventory/entities/sales-return-item.entity';
import { ProductBatchRepository } from '@inventory/product-batch.repository';
import { StockAdjustmentRepository } from '@inventory/stock-adjustment.repository';
import { SalesReturnRepository } from '@inventory/sales-return.repository';
import { ReturnsAnalyticsRepository } from '@inventory/returns-analytics.repository';
import { ExpiryService } from '@inventory/expiry.service';
import { ExpiryController } from '@inventory/expiry.controller';
import { StockAdjustmentsService } from '@inventory/stock-adjustments.service';
import { StockAdjustmentsController } from '@inventory/stock-adjustments.controller';
import { ReturnsService } from '@inventory/returns.service';
import { ExchangeService } from '@inventory/exchange.service';
import { ReturnsController } from '@inventory/returns.controller';
import { ProductsModule } from '@products/products.module';
import { UsersModule } from '@users/users.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { AccountingModule } from '@accounting/accounting.module';
import { PosModule } from '@pos/pos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      ProductBatch,
      StockAdjustment,
      SalesReturn,
      SalesReturnItem,
    ]),
    ProductsModule,
    UsersModule,
    NotificationsModule,
    AccountingModule,
    forwardRef(() => PosModule),
  ],
  controllers: [
    InventoryController,
    ExpiryController,
    StockAdjustmentsController,
    ReturnsController,
  ],
  providers: [
    InventoryService,
    InventoryRepository,
    ProductBatchRepository,
    StockAdjustmentRepository,
    SalesReturnRepository,
    ReturnsAnalyticsRepository,
    ExpiryService,
    StockAdjustmentsService,
    ReturnsService,
    ExchangeService,
  ],
  exports: [InventoryService, ExpiryService],
})
export class InventoryModule {}
