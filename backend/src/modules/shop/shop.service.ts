import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import {
  ShopReadRepository,
  type ProductWithStockRow,
} from '@/modules/shop/shop-read.repository';

import {
  StockStatus,
  ShopProductBranchRef,
  ShopProduct,
  ShopBranch,
  ShopSellableUnit,
} from '@/modules/shop/types';

// Re-export so existing callers that imported these from this file keep working.
export type {
  StockStatus,
  ShopProductBranchRef,
  ShopProduct,
  ShopBranch,
  ShopSellableUnit,
};

interface ListProductsQuery {
  branchId: string;
  category?: string;
  search?: string;
}

interface ListRecommendedQuery {
  branchId: string;
  productId?: string;
  category?: string;
  limit?: number;
}

@Injectable()
export class ShopService {
  constructor(private readonly shopRead: ShopReadRepository) {}

  async listProducts(query: ListProductsQuery): Promise<ShopProduct[]> {
    const rows = await this.shopRead.productsWithStock(query);

    const outProductIds = rows
      .filter((r) => this.computeStatusFromRow(r) === 'out')
      .map((r) => r.p_id);

    const otherBranchesByProduct = await this.lookupOtherBranches(
      outProductIds,
      query.branchId,
    );
    const unitsByProduct = await this.loadSellableUnits(
      rows.map((r) => r.p_id),
    );

    return rows.map((row) => {
      const stockStatus = this.computeStatusFromRow(row);
      return {
        id: row.p_id,
        name: row.p_name,
        description: row.p_description,
        category: row.p_category,
        sellingPrice: Number(row.p_selling_price),
        imageUrl: row.p_image_url,
        baseUnit: row.p_base_unit,
        sellableUnits: unitsByProduct.get(row.p_id) ?? [],
        stockStatus,
        availableBranches:
          stockStatus === 'out'
            ? (otherBranchesByProduct.get(row.p_id) ?? [])
            : [],
      };
    });
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.shopRead.distinctCategories();
    return rows.map((r) => r.category).filter((c): c is string => Boolean(c));
  }

  async listRecommended(query: ListRecommendedQuery): Promise<ShopProduct[]> {
    const limit = query.limit ?? 8;
    const contextProduct = query.productId
      ? await this.shopRead.findActiveProduct(query.productId)
      : null;
    const category = query.category ?? contextProduct?.category ?? null;
    const availableProducts = (
      await this.listProducts({ branchId: query.branchId })
    )
      .filter((product) => product.stockStatus !== 'out')
      .filter((product) => product.id !== query.productId);

    const topSellerRows = await this.shopRead.topSellers(query.branchId);
    const topSellerRank = new Map<string, number>();
    topSellerRows.forEach((row, index) => {
      topSellerRank.set(row.productId, 500 - index);
    });

    return availableProducts
      .map((product) => ({
        product,
        score:
          (category && product.category === category ? 1000 : 0) +
          (topSellerRank.get(product.id) ?? 0),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.product.name.localeCompare(b.product.name);
      })
      .slice(0, limit)
      .map((entry) => entry.product);
  }

  async getProduct(id: string, branchId?: string): Promise<ShopProduct> {
    const product = await this.shopRead.findActiveProductWithUnits(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let stockStatus: StockStatus = 'out';
    let availableBranches: ShopProductBranchRef[] = [];

    if (branchId) {
      const inv = await this.shopRead.findInventory(id, branchId);
      stockStatus = inv
        ? this.computeStatus(inv.quantity, inv.lowStockThreshold)
        : 'out';
      if (stockStatus === 'out') {
        const map = await this.lookupOtherBranches([id], branchId);
        availableBranches = map.get(id) ?? [];
      }
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      sellingPrice: Number(product.sellingPrice),
      imageUrl: product.imageUrl,
      baseUnit: product.baseUnit,
      sellableUnits: (product.sellableUnits ?? [])
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((u) => this.toShopSellableUnit(u)),
      stockStatus,
      availableBranches,
    };
  }

  async listActiveBranches(): Promise<ShopBranch[]> {
    const branches = await this.shopRead.activeBranches();
    const staffRows = await this.shopRead.staffCountsByBranch();

    const countByBranch = new Map<string, number>();
    for (const row of staffRows) {
      countByBranch.set(row.branchId, Number(row.count));
    }

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.addressLine1,
      phone: b.phone,
      staffCount: countByBranch.get(b.id) ?? 0,
    }));
  }

  private async loadSellableUnits(
    productIds: string[],
  ): Promise<Map<string, ShopSellableUnit[]>> {
    const map = new Map<string, ShopSellableUnit[]>();
    if (productIds.length === 0) return map;
    const units = await this.shopRead.sellableUnitsFor(productIds);
    for (const u of units) {
      const list = map.get(u.productId) ?? [];
      list.push(this.toShopSellableUnit(u));
      map.set(u.productId, list);
    }
    return map;
  }

  private toShopSellableUnit(u: ProductSellableUnit): ShopSellableUnit {
    return {
      id: u.id,
      name: u.name,
      isBase: u.isBase,
      conversionToBase: Number(u.conversionToBase),
      sellingPrice: Number(u.sellingPrice),
      displayOrder: u.displayOrder,
    };
  }

  private async lookupOtherBranches(
    productIds: string[],
    excludeBranchId: string,
  ): Promise<Map<string, ShopProductBranchRef[]>> {
    const map = new Map<string, ShopProductBranchRef[]>();
    if (productIds.length === 0) return map;

    const rows = await this.shopRead.otherBranchesWithStock(
      productIds,
      excludeBranchId,
    );

    for (const row of rows) {
      const list = map.get(row.product_id) ?? [];
      list.push({ id: row.branch_id, name: row.branch_name });
      map.set(row.product_id, list);
    }
    return map;
  }

  private computeStatusFromRow(row: ProductWithStockRow): StockStatus {
    if (row.inv_quantity === null || row.inv_quantity === undefined) {
      return 'out';
    }
    const quantity = Number(row.inv_quantity);
    const threshold = Number(row.inv_low_stock_threshold ?? 0);
    return this.computeStatus(quantity, threshold);
  }

  private computeStatus(quantity: number, threshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'in';
  }
}
