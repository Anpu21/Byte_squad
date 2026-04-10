import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from '@super-admin/super-admin.controller';
import { SuperAdminService } from '@super-admin/super-admin.service';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { Inventory } from '@inventory/entities/inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, User, Transaction, Inventory]),
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
