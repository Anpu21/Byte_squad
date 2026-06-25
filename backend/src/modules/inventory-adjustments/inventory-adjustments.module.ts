import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustment } from '@/modules/inventory-adjustments/entities/stock-adjustment.entity';
import { StockAdjustmentRepository } from '@/modules/inventory-adjustments/stock-adjustment.repository';
import { StockAdjustmentsService } from '@/modules/inventory-adjustments/stock-adjustments.service';
import { StockAdjustmentsController } from '@/modules/inventory-adjustments/stock-adjustments.controller';
import { ProductsModule } from '@products/products.module';
import { UsersModule } from '@users/users.module';
import { NotificationsModule } from '@notifications/notifications.module';

/**
 * Stock adjustments — reason-coded inventory corrections from a physical count.
 * Applying an adjustment sets the on-hand to the counted quantity and appends a
 * StockMovement audit row; large manager corrections wait on admin approval.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([StockAdjustment]),
    ProductsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [StockAdjustmentsController],
  providers: [StockAdjustmentRepository, StockAdjustmentsService],
  exports: [],
})
export class InventoryAdjustmentsModule {}
