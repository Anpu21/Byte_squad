import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '@common/config/database.config';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { BranchesModule } from '@branches/branches.module';
import { ProductsModule } from '@products/products.module';
import { InventoryModule } from '@inventory/inventory.module';
import { PosModule } from '@pos/pos.module';
import { AccountingModule } from '@accounting/accounting.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { AdminSeedService } from '@common/seeds/admin-seed.service';

import appConfig from '@common/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([User, Branch]),
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    InventoryModule,
    PosModule,
    AccountingModule,
    NotificationsModule,
  ],
  providers: [AdminSeedService],
})
export class AppModule {}
