import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransfersController } from '@stock-transfers/stock-transfers.controller';
import { StockTransfersService } from '@stock-transfers/stock-transfers.service';
import { StockTransfersRepository } from '@stock-transfers/stock-transfers.repository';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { ProductsModule } from '@products/products.module';
import { BranchesModule } from '@branches/branches.module';
import { InventoryModule } from '@inventory/inventory.module';
import { UsersModule } from '@users/users.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockTransferRequest]),
    ProductsModule,
    BranchesModule,
    InventoryModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [StockTransfersController],
  providers: [StockTransfersService, StockTransfersRepository],
})
export class StockTransfersModule {}
