import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { PayherePaymentAttempt } from '@/modules/customer-orders/entities/payhere-payment-attempt.entity';
import { CustomerOrdersService } from '@/modules/customer-orders/customer-orders.service';
import { CustomerOrdersController } from '@/modules/customer-orders/customer-orders.controller';
import { CustomerOrdersRepository } from '@/modules/customer-orders/customer-orders.repository';
import { PayhereService } from '@/modules/customer-orders/payhere.service';
import { ProductsModule } from '@products/products.module';
import { BranchesModule } from '@branches/branches.module';
import { UsersModule } from '@users/users.module';
import { PosSalesModule } from '@/modules/pos-sales/pos-sales.module';
import { AccountingCoreModule } from '@/modules/accounting-core/accounting-core.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { InventoryCoreModule } from '@/modules/inventory-core/inventory-core.module';
import { LoyaltyWalletsModule } from '@/modules/loyalty-wallets/loyalty-wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderItem,
      PayherePaymentAttempt,
    ]),
    ProductsModule,
    BranchesModule,
    UsersModule,
    PosSalesModule,
    AccountingCoreModule,
    NotificationsModule,
    InventoryCoreModule,
    LoyaltyWalletsModule,
  ],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService, CustomerOrdersRepository, PayhereService],
  exports: [CustomerOrdersService, CustomerOrdersRepository],
})
export class CustomerOrdersModule {}
