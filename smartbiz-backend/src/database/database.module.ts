import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import all entities
import { User } from '@modules/users/entities/user.entity';
import { Role } from '@modules/users/entities/role.entity';
import { Company } from '@modules/companies/entities/company.entity';
import { Branch } from '@modules/companies/entities/branch.entity';
import { Ledger } from '@modules/ledgers/entities/ledger.entity';
import { LedgerGroup } from '@modules/ledgers/entities/ledger-group.entity';
import { Voucher } from '@modules/vouchers/entities/voucher.entity';
import { VoucherEntry } from '@modules/vouchers/entities/voucher-entry.entity';
import { Item } from '@modules/inventory/entities/item.entity';
import { StockMovement } from '@modules/inventory/entities/stock-movement.entity';
import { ItemCategory } from '@modules/inventory/entities/item-category.entity';
import { Payment } from '@modules/payments/entities/payment.entity';
import { AuditLog } from './entities/audit-log.entity';
import { BackupLog } from './entities/backup-log.entity';

const entities = [
    User,
    Role,
    Company,
    Branch,
    Ledger,
    LedgerGroup,
    Voucher,
    VoucherEntry,
    Item,
    StockMovement,
    ItemCategory,
    Payment,
    AuditLog,
    BackupLog,
];

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'better-sqlite3',
                database: configService.get<string>('database.sqlite.database'),
                entities,
                synchronize: configService.get<string>('app.nodeEnv') !== 'production',
                logging: configService.get<string>('app.nodeEnv') === 'development',
            }),
        }),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule { }
