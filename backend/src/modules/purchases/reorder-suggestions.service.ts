import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { PurchaseOrder } from '@/modules/purchases/entities/purchase-order.entity';
import { PurchaseOrdersService } from '@/modules/purchases/purchase-orders.service';
import { ReorderSuggestionsRepository } from '@/modules/purchases/reorder-suggestions.repository';
import { ReorderSuggestionsQueryDto } from '@/modules/purchases/dto/reorder-suggestions-query.dto';
import { DraftPurchaseOrdersDto } from '@/modules/purchases/dto/draft-purchase-orders.dto';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';
import type {
  ReorderSuggestionLine,
  ReorderSuggestionsReport,
  ReorderSupplierGroup,
} from '@/modules/purchases/types/reorder-suggestion.type';

const DEFAULT_LEAD_DAYS = 7;
const DEFAULT_LOOKBACK_DAYS = 30;
const MS_PER_DAY = 86_400_000;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * On-demand reorder suggestions: turn low stock + recent sales velocity into
 * a per-supplier shopping list, then (on approval) into Draft purchase orders
 * via the standard PO create path. No scheduler — mirrors the expiry scan.
 *
 *   suggestedQty = ceil(velocityPerDay × leadDays + safety − onHand − onOrder)
 *
 * where safety is the branch's low-stock threshold and the supplier + unit
 * cost are inferred from the most recent GRN that included the product.
 */
@Injectable()
export class ReorderSuggestionsService {
  constructor(
    private readonly repo: ReorderSuggestionsRepository,
    private readonly purchaseOrders: PurchaseOrdersService,
  ) {}

  async suggest(
    query: ReorderSuggestionsQueryDto,
    actor: PurchasesActor,
  ): Promise<ReorderSuggestionsReport> {
    const branchId = this.resolveBranch(query.branchId, actor);
    const leadDays = query.leadDays ?? DEFAULT_LEAD_DAYS;
    const lookbackDays = query.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
    const now = new Date();
    const since = new Date(now.getTime() - lookbackDays * MS_PER_DAY);

    const [inventory, salesMap, onOrderMap, supplierMap] = await Promise.all([
      this.repo.inventoryForBranch(branchId),
      this.repo.salesQtyByProduct(branchId, since),
      this.repo.onOrderByProduct(branchId),
      this.repo.lastSupplierByProduct(branchId),
    ]);

    const groups = new Map<string, ReorderSupplierGroup>();
    let unassignedCount = 0;

    for (const row of inventory) {
      const soldInWindow = salesMap.get(row.productId) ?? 0;
      const velocityPerDay = round2(soldInWindow / lookbackDays);
      const onOrder = onOrderMap.get(row.productId) ?? 0;
      const suggestedQty = Math.ceil(
        velocityPerDay * leadDays +
          row.lowStockThreshold -
          row.onHand -
          onOrder,
      );
      if (suggestedQty <= 0) continue;

      const supplier = supplierMap.get(row.productId);
      if (!supplier) {
        unassignedCount += 1;
        continue;
      }

      const unitCost =
        supplier.unitCost > 0 ? supplier.unitCost : row.costPrice;
      const line: ReorderSuggestionLine = {
        productId: row.productId,
        productName: row.productName,
        baseUnit: row.baseUnit,
        onHand: row.onHand,
        onOrder,
        safetyStock: row.lowStockThreshold,
        velocityPerDay,
        suggestedQty,
        unitCost,
      };

      const group = groups.get(supplier.supplierId) ?? {
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        lines: [],
        totalValue: 0,
      };
      group.lines.push(line);
      group.totalValue = round2(group.totalValue + suggestedQty * unitCost);
      groups.set(supplier.supplierId, group);
    }

    return {
      branchId,
      leadDays,
      lookbackDays,
      generatedAt: now,
      groups: [...groups.values()].sort((a, b) => b.totalValue - a.totalValue),
      unassignedCount,
    };
  }

  /** Create one Draft PO per supplier group through the standard PO path. */
  async draft(
    dto: DraftPurchaseOrdersDto,
    actor: PurchasesActor,
  ): Promise<PurchaseOrder[]> {
    const created: PurchaseOrder[] = [];
    for (const order of dto.orders) {
      created.push(await this.purchaseOrders.create(order, actor));
    }
    return created;
  }

  private resolveBranch(
    requested: string | undefined,
    actor: PurchasesActor,
  ): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException(
          'branchId is required when viewing suggestions as an admin',
        );
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot view suggestions for another branch',
      );
    }
    return actor.branchId;
  }
}
