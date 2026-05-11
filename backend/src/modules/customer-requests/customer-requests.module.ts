import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRequest } from '@/modules/customer-requests/entities/customer-request.entity';
import { CustomerRequestItem } from '@/modules/customer-requests/entities/customer-request-item.entity';
import { CustomerRequestsService } from '@/modules/customer-requests/customer-requests.service';
import { CustomerRequestsController } from '@/modules/customer-requests/customer-requests.controller';
import { CustomerRequestsRepository } from '@/modules/customer-requests/customer-requests.repository';
import { ProductsModule } from '@products/products.module';
import { BranchesModule } from '@branches/branches.module';
import { UsersModule } from '@users/users.module';
import { PosModule } from '@pos/pos.module';
import { AccountingModule } from '@accounting/accounting.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerRequest, CustomerRequestItem]),
    ProductsModule,
    BranchesModule,
    UsersModule,
    PosModule,
    AccountingModule,
    NotificationsModule,
  ],
  controllers: [CustomerRequestsController],
  providers: [CustomerRequestsService, CustomerRequestsRepository],
  exports: [CustomerRequestsService, CustomerRequestsRepository],
})
export class CustomerRequestsModule {}
