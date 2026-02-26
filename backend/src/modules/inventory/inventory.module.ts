import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from '@inventory/inventory.service';
import { InventoryController } from '@inventory/inventory.controller';
import { Inventory } from '@inventory/entities/inventory.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Inventory])],
    controllers: [InventoryController],
    providers: [InventoryService],
    exports: [InventoryService],
})
export class InventoryModule { }
