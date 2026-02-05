import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ledger } from '@modules/ledgers/entities/ledger.entity';
import { Voucher } from '@modules/vouchers/entities/voucher.entity';
import { VoucherEntry } from '@modules/vouchers/entities/voucher-entry.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Ledger, Voucher, VoucherEntry])],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
