import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from './pos.service.js';
import { PosController } from './pos.controller.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionItem } from './entities/transaction-item.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, TransactionItem])],
    controllers: [PosController],
    providers: [PosService],
    exports: [PosService],
})
export class PosModule { }
