import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';
import { UpdateStockDto } from '@inventory/dto/update-stock.dto';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Inventory)
        private readonly inventoryRepository: Repository<Inventory>,
    ) { }

    async findByBranch(branchId: string): Promise<Inventory[]> {
        return this.inventoryRepository.find({
            where: { branchId },
            relations: ['product'],
        });
    }

    async findLowStock(): Promise<Inventory[]> {
        return this.inventoryRepository
            .createQueryBuilder('inventory')
            .leftJoinAndSelect('inventory.product', 'product')
            .leftJoinAndSelect('inventory.branch', 'branch')
            .where('inventory.quantity <= inventory.low_stock_threshold')
            .getMany();
    }

    async updateStock(id: string, dto: UpdateStockDto): Promise<Inventory | null> {
        await this.inventoryRepository.update(id, {
            quantity: dto.quantity,
            ...(dto.lowStockThreshold !== undefined && {
                lowStockThreshold: dto.lowStockThreshold,
            }),
            lastRestockedAt: new Date(),
        });
        return this.inventoryRepository.findOne({
            where: { id },
            relations: ['product', 'branch'],
        });
    }

    async checkLowStockByProductAndBranch(
        productId: string,
        branchId: string,
    ): Promise<boolean> {
        const inventory = await this.inventoryRepository.findOne({
            where: { productId, branchId },
        });

        if (!inventory) return false;
        return inventory.quantity <= inventory.lowStockThreshold;
    }
}
