import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '@products/products.module';
import { BranchesModule } from '@branches/branches.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { CustomerOrdersModule } from '@/modules/customer-orders/customer-orders.module';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';
import { CustomerGroupMember } from '@/modules/customer-groups/entities/customer-group-member.entity';
import { GroupCartItem } from '@/modules/customer-groups/entities/group-cart-item.entity';
import { CustomerGroupsRepository } from '@/modules/customer-groups/customer-groups.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { CustomerGroupsController } from '@/modules/customer-groups/customer-groups.controller';
import { GroupCartRepository } from '@/modules/customer-groups/group-cart.repository';
import { GroupCartService } from '@/modules/customer-groups/group-cart.service';
import { GroupCartController } from '@/modules/customer-groups/group-cart.controller';
import { GroupCheckoutService } from '@/modules/customer-groups/group-checkout.service';
import { GroupCheckoutController } from '@/modules/customer-groups/group-checkout.controller';
import { GroupAnalyticsRepository } from '@/modules/customer-groups/group-analytics.repository';
import { GroupAnalyticsService } from '@/modules/customer-groups/group-analytics.service';
import { GroupAnalyticsController } from '@/modules/customer-groups/group-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerGroup,
      CustomerGroupMember,
      GroupCartItem,
    ]),
    ProductsModule,
    BranchesModule,
    NotificationsModule,
    CustomerOrdersModule,
  ],
  controllers: [
    CustomerGroupsController,
    GroupCartController,
    GroupCheckoutController,
    GroupAnalyticsController,
  ],
  providers: [
    CustomerGroupsRepository,
    CustomerGroupsService,
    GroupCartRepository,
    GroupCartService,
    GroupCheckoutService,
    GroupAnalyticsRepository,
    GroupAnalyticsService,
  ],
  exports: [CustomerGroupsService, CustomerGroupsRepository, GroupCartService],
})
export class CustomerGroupsModule {}
