import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransfersController } from '@stock-transfers/stock-transfers.controller';
import { StockTransfersService } from '@stock-transfers/stock-transfers.service';
import { StockTransfersRepository } from '@stock-transfers/stock-transfers.repository';
import { ShipmentsController } from '@stock-transfers/shipments.controller';
import { ShipmentsService } from '@stock-transfers/shipments.service';
import { ShipmentsRepository } from '@stock-transfers/shipments.repository';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Shipment } from '@stock-transfers/entities/shipment.entity';
import { ShipmentEvent } from '@stock-transfers/entities/shipment-event.entity';
import { ProductsModule } from '@products/products.module';
import { BranchesModule } from '@branches/branches.module';
import { InventoryModule } from '@inventory/inventory.module';
import { UsersModule } from '@users/users.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { HrModule } from '@/modules/hr/hr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockTransferRequest, Shipment, ShipmentEvent]),
    ProductsModule,
    BranchesModule,
    InventoryModule,
    UsersModule,
    NotificationsModule,
    // Courier validation resolves WORKER login accounts to their HR employee.
    HrModule,
  ],
  controllers: [StockTransfersController, ShipmentsController],
  providers: [
    StockTransfersService,
    StockTransfersRepository,
    ShipmentsService,
    ShipmentsRepository,
  ],
})
export class StockTransfersModule {}
