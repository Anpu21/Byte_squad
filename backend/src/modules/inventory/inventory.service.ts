import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inventory } from '@inventory/entities/inventory.entity';
import {
  InventoryRepository,
  PagedInventory,
  StockStatus,
} from '@inventory/inventory.repository';
import { InventorySummaryForProduct } from '@inventory/types/inventory-summary-for-product.type';
import { CreateInventoryDto } from '@inventory/dto/create-inventory.dto';
import { UpdateStockDto } from '@inventory/dto/update-stock.dto';
import { ProductsService } from '@products/products.service';

function hasAtMostThreeDecimals(value: number): boolean {
  const scaled = value * 1000;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly products: ProductsService,
  ) {}

  // ── Cross-module pass-throughs (owner-service surface; blaxx nestjs-07) ──
  // Sibling modules read/decrement stock through these, never the repository.
  findByProductAndBranch(
    productId: string,
    branchId: string,
  ): Promise<Inventory | null> {
    return this.inventory.findByProductAndBranch(productId, branchId);
  }

  findByProductInBranches(
    productId: string,
    branchIds: readonly string[],
  ): Promise<Inventory[]> {
    return this.inventory.findByProductInBranches(productId, branchIds);
  }

  findByProductIds(productIds: readonly string[]): Promise<Inventory[]> {
    return this.inventory.findByProductIds(productIds);
  }

  countActiveForBranch(branchId: string): Promise<number> {
    return this.inventory.countActiveForBranch(branchId);
  }

  countLowStockForBranch(branchId: string): Promise<number> {
    return this.inventory.countLowStockForBranch(branchId);
  }

  decrementStockBatch(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<{ ok: boolean; failedProductId: string | null }> {
    return this.inventory.decrementStockBatch(branchId, items);
  }

  summaryForProduct(
    productId: string,
    branchId: string | null,
  ): Promise<InventorySummaryForProduct> {
    return this.inventory.summaryForProduct(productId, branchId);
  }

  async create(dto: CreateInventoryDto): Promise<Inventory> {
    await this.assertValidQuantity(dto.productId, dto.quantity);
    return this.inventory.createAndSave({
      productId: dto.productId,
      branchId: dto.branchId,
      quantity: dto.quantity,
      lowStockThreshold: dto.lowStockThreshold ?? 10,
      lastRestockedAt: dto.quantity > 0 ? new Date() : null,
    });
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
  ): Promise<PagedInventory> {
    return this.inventory.findByBranchPaged({
      branchId,
      search: options?.search,
      category: options?.category,
      stockStatus: options?.stockStatus as StockStatus | undefined,
      page: options?.page ?? 1,
      limit: options?.limit ?? 10,
    });
  }

  async findLowStock(branchId?: string): Promise<Inventory[]> {
    return this.inventory.findLowStock(branchId);
  }

  async updateStock(
    id: string,
    dto: UpdateStockDto,
  ): Promise<Inventory | null> {
    await this.assertValidQuantity(dto.productId, dto.quantity);
    await this.inventory.update(id, {
      quantity: dto.quantity,
      ...(dto.lowStockThreshold !== undefined && {
        lowStockThreshold: dto.lowStockThreshold,
      }),
      lastRestockedAt: new Date(),
    });
    return this.inventory.findById(id);
  }

  async checkLowStockByProductAndBranch(
    productId: string,
    branchId: string,
  ): Promise<boolean> {
    const inventory = await this.inventory.findByProductAndBranch(
      productId,
      branchId,
    );
    if (!inventory) return false;
    return inventory.quantity <= inventory.lowStockThreshold;
  }

  private async assertValidQuantity(
    productId: string,
    quantity: number,
  ): Promise<void> {
    if (!hasAtMostThreeDecimals(quantity)) {
      throw new BadRequestException('Stock quantity supports up to 3 decimals');
    }
    const product = await this.products.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }
    if (product.baseUnit === 'unit' && !Number.isInteger(quantity)) {
      throw new BadRequestException(
        'UNIT stock quantity must be a whole number',
      );
    }
  }
}
