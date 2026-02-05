import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities';

@Module({
    imports: [TypeOrmModule.forFeature([Payment])],
    exports: [TypeOrmModule],
})
export class PaymentsModule { }
