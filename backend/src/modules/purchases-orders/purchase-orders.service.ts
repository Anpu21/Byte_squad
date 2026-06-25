import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { PurchaseOrder } from '@/modules/purchases-orders/entities/purchase-order.entity';
import { PurchaseOrdersRepository } from '@/modules/purchases-orders/purchase-orders.repository';
import { GrnsRepository } from '@/modules/purchases-grn/grns.repository';
import { PurchaseDocNumberService } from '@/modules/purchases-doc-numbering/purchase-doc-number.service';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { CreatePurchaseOrderDto } from '@/modules/purchases-orders/dto/create-purchase-order.dto';
import { ListPurchaseOrdersQueryDto } from '@/modules/purchases-orders/dto/list-purchase-orders-query.dto';
import type { PurchasesActor } from '@/modules/purchases-grn/types/purchases-actor.type';

export interface PurchaseOrdersListResponse {
  rows: PurchaseOrder[];
  total: number;
  limit: number;
  offset: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Purchase orders — BUSY's "intent" voucher. No stock/ledger effect; they
 * exist for the pending-orders view and to pre-fill the GRN at receiving
 * time. Lifecycle: Draft → Sent → Received (set by GRN conversion) or
 * Cancelled.
 */
@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly orders: PurchaseOrdersRepository,
    private readonly grns: GrnsRepository,
    private readonly suppliers: SuppliersRepository,
    private readonly docNumbers: PurchaseDocNumberService,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    query: ListPurchaseOrdersQueryDto,
    actor: PurchasesActor,
  ): Promise<PurchaseOrdersListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const branchId =
      actor.role === UserRole.ADMIN
        ? query.branchId
        : (actor.branchId ?? undefined);
    const { rows, total } = await this.orders.list({
      branchId,
      supplierId: query.supplierId,
      status: query.status,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  async getById(id: string, actor: PurchasesActor): Promise<PurchaseOrder> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    if (actor.role !== UserRole.ADMIN && order.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot access purchase documents outside your branch',
      );
    }
    return order;
  }

  async create(
    dto: CreatePurchaseOrderDto,
    actor: PurchasesActor,
  ): Promise<PurchaseOrder> {
    const branchId = this.resolveBranch(dto.branchId, actor);

    const supplier = await this.suppliers.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.status !== 'Active') {
      throw new ConflictException(
        `Supplier "${supplier.name}" is inactive — reactivate before ordering`,
      );
    }

    const productIds = [...new Set(dto.items.map((it) => it.productId))];
    const products = await this.grns.findProductsByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const it of dto.items) {
      if (!productById.get(it.productId)) {
        throw new NotFoundException(`Product ${it.productId} not found`);
      }
    }

    const totalValue = round2(
      dto.items.reduce((sum, it) => sum + it.quantity * it.unitCost, 0),
    );

    const orderId = await this.dataSource.transaction(async (manager) => {
      const poNumber = await this.docNumbers.next(
        'PO',
        new Date().getFullYear(),
        manager,
      );
      const order = await this.orders.insertOrder(manager, {
        poNumber,
        supplierId: supplier.id,
        branchId,
        status: 'Draft',
        expectedDate: dto.expectedDate ?? null,
        totalValue,
        notes: dto.notes ?? null,
        createdByUserId: actor.id,
      });
      for (const it of dto.items) {
        await this.orders.insertItem(manager, {
          purchaseOrderId: order.id,
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost,
        });
      }
      return order.id;
    });

    const saved = await this.orders.findById(orderId);
    if (!saved) throw new NotFoundException('PO vanished after save');
    return saved;
  }

  /** Draft → Sent (the "we've emailed/phoned it to the supplier" marker). */
  async send(id: string, actor: PurchasesActor): Promise<PurchaseOrder> {
    const order = await this.getById(id, actor);
    if (order.status !== 'Draft') {
      throw new ConflictException(
        `Only Draft orders can be sent (this one is ${order.status})`,
      );
    }
    await this.orders.updateStatus(order.id, 'Sent');
    return this.getById(id, actor);
  }

  async cancel(id: string, actor: PurchasesActor): Promise<PurchaseOrder> {
    const order = await this.getById(id, actor);
    if (order.status !== 'Draft' && order.status !== 'Sent') {
      throw new ConflictException(
        `Cannot cancel a purchase order in status ${order.status}`,
      );
    }
    await this.orders.updateStatus(order.id, 'Cancelled');
    return this.getById(id, actor);
  }

  private resolveBranch(
    requested: string | undefined,
    actor: PurchasesActor,
  ): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException(
          'branchId is required when ordering as an admin',
        );
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot order for another branch');
    }
    return actor.branchId;
  }
}
