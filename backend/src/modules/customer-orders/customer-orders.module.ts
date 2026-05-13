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
import { PosModule } from '@pos/pos.module';
import { AccountingModule } from '@accounting/accounting.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { InventoryModule } from '@inventory/inventory.module';
import { LoyaltyModule } from '@/modules/loyalty/loyalty.module';

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
    PosModule,
    AccountingModule,
    NotificationsModule,
    InventoryModule,
    LoyaltyModule,
  ],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService, CustomerOrdersRepository, PayhereService],
  exports: [CustomerOrdersService, CustomerOrdersRepository],
})
export class CustomerOrdersModule {}
