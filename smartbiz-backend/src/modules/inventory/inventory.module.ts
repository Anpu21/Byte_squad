import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemCategory, StockMovement } from './entities';

@Module({
    imports: [TypeOrmModule.forFeature([Item, ItemCategory, StockMovement])],
    exports: [TypeOrmModule],
})
export class InventoryModule { }
