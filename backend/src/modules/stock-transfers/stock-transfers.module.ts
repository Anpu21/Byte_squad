import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransfersController } from '@stock-transfers/stock-transfers.controller';
import { StockTransfersService } from '@stock-transfers/stock-transfers.service';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entities/user.entity';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockTransferRequest,
      Inventory,
      Branch,
      Product,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [StockTransfersController],
  providers: [StockTransfersService],
})
export class StockTransfersModule {}
