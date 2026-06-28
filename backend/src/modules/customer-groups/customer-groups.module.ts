import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerGroup } from '@/modules/customer-groups/entities/customer-group.entity';
import { CustomerGroupMember } from '@/modules/customer-groups/entities/customer-group-member.entity';
import { GroupCartItem } from '@/modules/customer-groups/entities/group-cart-item.entity';
import { CustomerGroupsRepository } from '@/modules/customer-groups/customer-groups.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { CustomerGroupsController } from '@/modules/customer-groups/customer-groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerGroup,
      CustomerGroupMember,
      GroupCartItem,
    ]),
  ],
  controllers: [CustomerGroupsController],
  providers: [CustomerGroupsRepository, CustomerGroupsService],
  exports: [CustomerGroupsService, CustomerGroupsRepository],
})
export class CustomerGroupsModule {}
