import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';
import { CreateInventoryDto } from '@inventory/dto/create-inventory.dto';
import { UpdateStockDto } from '@inventory/dto/update-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async create(dto: CreateInventoryDto): Promise<Inventory> {
    const record = this.inventoryRepository.create({
      productId: dto.productId,
      branchId: dto.branchId,
      quantity: dto.quantity,
      lowStockThreshold: dto.lowStockThreshold ?? 10,
      lastRestockedAt: dto.quantity > 0 ? new Date() : null,
    });
    return this.inventoryRepository.save(record);
  }

  async findByBranch(
    branchId: string,
    options?: {
      search?: string;
      category?: string;
      stockStatus?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    const qb = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.branch_id = :branchId', { branchId })
      .andWhere('product.is_active = true');

    if (options?.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    if (options?.category) {
      qb.andWhere('product.category = :category', {
        category: options.category,
      });
    }

    if (options?.stockStatus) {
      switch (options.stockStatus) {
        case 'in_stock':
          qb.andWhere('inventory.quantity > inventory.low_stock_threshold');
          break;
        case 'low_stock':
          qb.andWhere(
            'inventory.quantity > 0 AND inventory.quantity <= inventory.low_stock_threshold',
          );
          break;
        case 'out_of_stock':
          qb.andWhere('inventory.quantity = 0');
          break;
      }
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLowStock(): Promise<Inventory[]> {
    return this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.branch', 'branch')
      .where('inventory.quantity <= inventory.low_stock_threshold')
      .getMany();
  }

  async updateStock(
    id: string,
    dto: UpdateStockDto,
  ): Promise<Inventory | null> {
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
