import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';

export interface ReorderInventoryRow {
  productId: string;
  productName: string;
  baseUnit: string;
  costPrice: number;
  onHand: number;
  lowStockThreshold: number;
}

export interface ReorderSupplierInfo {
  supplierId: string;
  supplierName: string;
  unitCost: number;
}

/**
 * Read-only aggregates behind reorder suggestions. Queries span modules
 * (inventory, stock movements, GRNs, open POs) but only reads — drafting
 * goes back through PurchaseOrdersService so all PO invariants hold.
 */
@Injectable()
export class ReorderSuggestionsRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** On-hand stock for a branch with the product name/cost/threshold. */
  async inventoryForBranch(branchId: string): Promise<ReorderInventoryRow[]> {
    const rows = await this.dataSource
      .getRepository(Inventory)
      .createQueryBuilder('inv')
      .innerJoin('inv.product', 'p')
      .select('inv.productId', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('p.baseUnit', 'baseUnit')
      .addSelect('p.costPrice', 'costPrice')
      .addSelect('inv.quantity', 'onHand')
      .addSelect('inv.lowStockThreshold', 'lowStockThreshold')
      .where('inv.branchId = :branchId', { branchId })
      .getRawMany<{
        productId: string;
        productName: string;
        baseUnit: string;
        costPrice: string;
        onHand: string;
        lowStockThreshold: number;
      }>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      baseUnit: r.baseUnit,
      costPrice: Number(r.costPrice),
      onHand: Number(r.onHand),
      lowStockThreshold: Number(r.lowStockThreshold),
    }));
  }

  /** Units sold per product in the window (qtyOut of Sale movements). */
  async salesQtyByProduct(
    branchId: string,
    since: Date,
  ): Promise<Map<string, number>> {
    const rows: Array<{ productId: string; qty: string }> =
      await this.dataSource.query(
        `
      SELECT product_id AS "productId", COALESCE(SUM(qty_out), 0) AS qty
      FROM stock_movements
      WHERE branch_id = $1 AND movement_type = 'Sale' AND created_at >= $2
      GROUP BY product_id
      `,
        [branchId, since],
      );
    return new Map(rows.map((r) => [r.productId, Number(r.qty)]));
  }

  /** Quantity already on open (Draft/Sent) purchase orders, per product. */
  async onOrderByProduct(branchId: string): Promise<Map<string, number>> {
    const rows: Array<{ productId: string; qty: string }> =
      await this.dataSource.query(
        `
      SELECT poi.product_id AS "productId", COALESCE(SUM(poi.quantity), 0) AS qty
      FROM purchase_order_items poi
      JOIN purchase_orders po ON po.id = poi.purchase_order_id
      WHERE po.branch_id = $1 AND po.status IN ('Draft', 'Sent')
      GROUP BY poi.product_id
      `,
        [branchId],
      );
    return new Map(rows.map((r) => [r.productId, Number(r.qty)]));
  }

  /** Supplier + last unit cost from the most recent GRN that had each product. */
  async lastSupplierByProduct(
    branchId: string,
  ): Promise<Map<string, ReorderSupplierInfo>> {
    const rows: Array<{
      productId: string;
      supplierId: string;
      supplierName: string;
      unitCost: string;
    }> = await this.dataSource.query(
      `
      SELECT DISTINCT ON (gi.product_id)
        gi.product_id AS "productId",
        g.supplier_id AS "supplierId",
        s.name        AS "supplierName",
        gi.unit_cost  AS "unitCost"
      FROM grn_items gi
      JOIN grns g ON g.id = gi.grn_id
      JOIN suppliers s ON s.id = g.supplier_id
      WHERE g.branch_id = $1
      ORDER BY gi.product_id, g.grn_date DESC, g.created_at DESC
      `,
      [branchId],
    );
    return new Map(
      rows.map((r) => [
        r.productId,
        {
          supplierId: r.supplierId,
          supplierName: r.supplierName,
          unitCost: Number(r.unitCost),
        },
      ]),
    );
  }
}
