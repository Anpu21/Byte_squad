import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRequest } from '@/modules/customer-requests/entities/customer-request.entity';
import { CustomerRequestItem } from '@/modules/customer-requests/entities/customer-request-item.entity';
import { CustomerRequestsService } from '@/modules/customer-requests/customer-requests.service';
import { CustomerRequestsController } from '@/modules/customer-requests/customer-requests.controller';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { CustomersModule } from '@/modules/customers/customers.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerRequest,
      CustomerRequestItem,
      Product,
      Branch,
      User,
      Transaction,
      LedgerEntry,
    ]),
    CustomersModule,
    NotificationsModule,
  ],
  controllers: [CustomerRequestsController],
  providers: [CustomerRequestsService],
  exports: [CustomerRequestsService],
})
export class CustomerRequestsModule {}
