import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBatch } from '@/modules/inventory-expiry/entities/product-batch.entity';
import { ProductBatchRepository } from '@/modules/inventory-expiry/product-batch.repository';
import { ExpiryService } from '@/modules/inventory-expiry/expiry.service';
import { ExpiryController } from '@/modules/inventory-expiry/expiry.controller';
import { ProductsModule } from '@products/products.module';
import { UsersModule } from '@users/users.module';
import { NotificationsModule } from '@notifications/notifications.module';

/**
 * Product-batch / expiry tracking — an additive layer over inventory core that
 * records goods-receipt lots with expiry dates and powers the expiry report and
 * expiry alerts. `inventory.quantity` stays the authoritative sell-from total.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductBatch]),
    ProductsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [ExpiryController],
  providers: [ProductBatchRepository, ExpiryService],
  exports: [],
})
export class InventoryExpiryModule {}
