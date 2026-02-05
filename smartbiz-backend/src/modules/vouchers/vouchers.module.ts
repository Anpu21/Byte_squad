import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher, VoucherEntry } from './entities';
import { Ledger } from '@modules/ledgers/entities/ledger.entity';
import { AccountingEngineService } from './services/accounting-engine.service';
import { VoucherController } from './controllers/voucher.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Voucher, VoucherEntry, Ledger])],
    controllers: [VoucherController],
    providers: [AccountingEngineService],
    exports: [AccountingEngineService],
})
export class VouchersModule { }
