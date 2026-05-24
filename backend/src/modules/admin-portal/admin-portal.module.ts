import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPortalController } from '@admin-portal/admin-portal.controller';
import { AdminPortalService } from '@admin-portal/admin-portal.service';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { Product } from '@products/entities/product.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { BranchesModule } from '@branches/branches.module';
import { UsersModule } from '@users/users.module';
import { InventoryModule } from '@inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, Expense]),
    BranchesModule,
    UsersModule,
    InventoryModule,
  ],
  controllers: [AdminPortalController],
  providers: [AdminPortalService],
})
export class AdminPortalModule {}
