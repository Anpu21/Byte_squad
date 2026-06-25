import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { InventoryRepository } from '@/modules/inventory-core/inventory.repository';
import { InventoryService } from '@/modules/inventory-core/inventory.service';
import { InventoryController } from '@/modules/inventory-core/inventory.controller';
import { ProductsModule } from '@products/products.module';

/**
 * Inventory core — the authoritative on-hand stock ledger (one row per
 * product/branch). Sibling domains (POS, purchases, stock-transfers,
 * customer-orders, expiry/adjustments/returns) read and mutate stock through
 * the exported InventoryService.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Inventory]), ProductsModule],
  controllers: [InventoryController],
  providers: [InventoryRepository, InventoryService],
  exports: [InventoryService],
})
export class InventoryCoreModule {}
