import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { Inventory } from './entities/inventory.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Inventory])],
    controllers: [InventoryController],
    providers: [InventoryService],
    exports: [InventoryService],
})
export class InventoryModule { }
