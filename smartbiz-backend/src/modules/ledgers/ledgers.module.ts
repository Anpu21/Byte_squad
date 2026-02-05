import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ledger, LedgerGroup } from './entities';

@Module({
    imports: [TypeOrmModule.forFeature([Ledger, LedgerGroup])],
    exports: [TypeOrmModule],
})
export class LedgersModule { }
