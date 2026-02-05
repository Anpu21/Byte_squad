import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { LedgersModule } from '@modules/ledgers/ledgers.module';
import { VouchersModule } from '@modules/vouchers/vouchers.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { BackupModule } from '@modules/backup/backup.module';
import { CompaniesModule } from '@modules/companies/companies.module';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig],
            envFilePath: ['.env.local', '.env'],
        }),

        // Database
        DatabaseModule,

        // Feature Modules
        AuthModule,
        UsersModule,
        CompaniesModule,
        LedgersModule,
        VouchersModule,
        InventoryModule,
        PaymentsModule,
        ReportsModule,
        BackupModule,
    ],
})
export class AppModule { }
