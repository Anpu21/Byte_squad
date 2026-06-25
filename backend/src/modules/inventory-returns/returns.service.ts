import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { StockMovement } from '@/modules/pos-sales/entities/stock-movement.entity';
import { SalesReturn } from '@/modules/inventory-returns/entities/sales-return.entity';
import { SalesReturnItem } from '@/modules/inventory-returns/entities/sales-return-item.entity';
import { SalesReturnRepository } from '@/modules/inventory-returns/sales-return.repository';
import { PosService } from '@/modules/pos-sales/pos.service';
import { AccountingService } from '@/modules/accounting-core/accounting.service';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { AuthUser } from '@common/types/auth-user.type';
import { CreateSalesReturnDto } from '@/modules/inventory-returns/dto/create-sales-return.dto';
import { ListReturnsQueryDto } from '@/modules/inventory-returns/dto/list-returns-query.dto';
import {
  PaginatedSalesReturns,
  ReturnableLine,
  SaleReturnLookup,
} from '@/modules/inventory-returns/types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

@Injectable()
export class ReturnsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly returns: SalesReturnRepository,
    private readonly sales: PosService,
    private readonly accounting: AccountingService,
  ) {}

  /** Look up a sale by invoice and report what's still returnable per line. */
  async lookupSale(
    actor: AuthUser,
    invoiceNumber: string,
  ): Promise<SaleReturnLookup> {
    const sale = await this.sales.findByInvoiceNumber(invoiceNumber.trim());
    if (!sale) {
      throw new NotFoundException(`No sale found for invoice ${invoiceNumber}`);
    }
    this.assertBranchAccess(actor, sale.branchId);
    if (sale.status === 'Voided') {
      throw new BadRequestException('This sale has been voided');
    }

    const returnedMap = await this.returns.returnedQtyBySale(sale.id);
    const lines: ReturnableLine[] = (sale.items ?? [])
      .filter((item) => item.status === 'Active')
      .map((item) => {
        const already = returnedMap.get(item.id) ?? 0;
        const remaining = round3(Number(item.quantity) - already);
        return {
          saleItemId: item.id,
          productId: item.productId,
          productName: item.product?.name ?? '',
          barcode: item.product?.barcode ?? '',
          unitLabel: item.unit?.name ?? null,
          quantitySold: Number(item.quantity),
          alreadyReturned: already,
          remaining,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        };
      });

    return {
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      branchId: sale.branchId,
      customerUserId: sale.customerUserId,
      total: Number(sale.total),
      createdAt: sale.createdAt,
      lines,
    };
  }

  /** Process a return: restock good units, scrap bad, refund the customer. */
  async createReturn(
    actor: AuthUser,
    dto: CreateSalesReturnDto,
  ): Promise<SalesReturn> {
    const sale = await this.sales.findOneById(dto.saleId);
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    this.assertBranchAccess(actor, sale.branchId);
    if (sale.status === 'Voided') {
      throw new BadRequestException('This sale has been voided');
    }

    const returnedMap = await this.returns.returnedQtyBySale(sale.id);
    const itemById = new Map((sale.items ?? []).map((i) => [i.id, i]));

    const returnItems: SalesReturnItem[] = [];
    const restockOps: { productId: string; baseQtyGood: number }[] = [];
    let totalRefund = 0;
    let restockedValue = 0;

    for (const line of dto.lines) {
      const item = itemById.get(line.saleItemId);
      if (!item) {
        throw new BadRequestException(
          `Sale item ${line.saleItemId} is not on this sale`,
        );
      }
      const requested = round3(line.goodQuantity + line.badQuantity);
      if (requested <= 0) continue;

      const already = returnedMap.get(item.id) ?? 0;
      const remaining = round3(Number(item.quantity) - already);
      if (requested > remaining + 1e-9) {
        throw new BadRequestException(
          `Return exceeds remaining quantity for ${item.product?.name ?? item.id}`,
        );
      }

      const soldQty = Number(item.quantity);
      const perUnitBase = soldQty > 0 ? Number(item.baseUnitQty) / soldQty : 0;
      const perUnitRefund = soldQty > 0 ? Number(item.lineTotal) / soldQty : 0;
      const baseQtyGood = round3(line.goodQuantity * perUnitBase);
      const refundAmount = round2(requested * perUnitRefund);
      totalRefund = round2(totalRefund + refundAmount);

      const willRestock = line.restockGood && line.goodQuantity > 0;
      if (willRestock) {
        restockedValue = round2(
          restockedValue + round2(line.goodQuantity * perUnitRefund),
        );
        restockOps.push({ productId: item.productId, baseQtyGood });
      }

      const ri = new SalesReturnItem();
      ri.saleItemId = item.id;
      ri.productId = item.productId;
      ri.goodQuantity = line.goodQuantity;
      ri.badQuantity = line.badQuantity;
      ri.baseUnitQtyGood = willRestock ? baseQtyGood : 0;
      ri.restockGood = line.restockGood;
      ri.refundAmount = refundAmount;
      returnItems.push(ri);
    }

    if (returnItems.length === 0) {
      throw new BadRequestException('No quantities to return');
    }

    return this.dataSource.transaction(async (manager) => {
      const ret = this.returns.create({
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        branchId: sale.branchId,
        customerUserId: sale.customerUserId,
        totalRefundAmount: totalRefund,
        restockedValue,
        reason: dto.reason ?? null,
        status: 'Completed',
        createdByUserId: actor.id,
        items: returnItems,
      });
      const savedReturn = await this.returns.save(ret, manager);

      const invRepo = manager.getRepository(Inventory);
      const movementRepo = manager.getRepository(StockMovement);
      for (const op of restockOps) {
        const inv = await invRepo
          .createQueryBuilder('i')
          .setLock('pessimistic_write')
          .where('i.product_id = :p AND i.branch_id = :b', {
            p: op.productId,
            b: sale.branchId,
          })
          .getOne();

        let balanceAfter: number;
        if (inv) {
          inv.quantity = round3(Number(inv.quantity) + op.baseQtyGood);
          await invRepo.save(inv);
          balanceAfter = Number(inv.quantity);
        } else {
          const created = await invRepo.save(
            invRepo.create({
              productId: op.productId,
              branchId: sale.branchId,
              quantity: op.baseQtyGood,
              lowStockThreshold: 10,
            }),
          );
          balanceAfter = Number(created.quantity);
        }

        await movementRepo.save(
          movementRepo.create({
            productId: op.productId,
            branchId: sale.branchId,
            location: sale.location,
            movementType: 'Return',
            qtyIn: op.baseQtyGood,
            qtyOut: 0,
            balanceAfter,
            refType: 'SalesReturn',
            refId: savedReturn.id,
            notes: `Return ${sale.invoiceNumber}`,
            createdByUserId: actor.id,
          }),
        );
      }

      if (totalRefund > 0) {
        await this.accounting.createLedgerEntryWithManager(manager, {
          branchId: sale.branchId,
          entryType: LedgerEntryType.DEBIT,
          amount: totalRefund,
          description: `Sales Return — ${sale.invoiceNumber}`,
          referenceNumber: `RET-${savedReturn.id.slice(0, 8).toUpperCase()}`,
          saleId: sale.id,
        });
      }

      return savedReturn;
    });
  }

  async listReturns(
    actor: AuthUser,
    query: ListReturnsQueryDto,
  ): Promise<PaginatedSalesReturns> {
    const branchId = this.resolveReadBranch(actor, query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.returns.listForBranch({
      branchId,
      page,
      limit,
    });
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private assertBranchAccess(actor: AuthUser, branchId: string): void {
    if (actor.role !== UserRole.ADMIN && actor.branchId !== branchId) {
      // Never leak the existence of sales rung up at other branches.
      throw new NotFoundException('Sale not found');
    }
  }

  private resolveReadBranch(
    actor: AuthUser,
    requested?: string,
  ): string | null {
    if (actor.role === UserRole.ADMIN) return requested ?? null;
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    return actor.branchId;
  }
}
