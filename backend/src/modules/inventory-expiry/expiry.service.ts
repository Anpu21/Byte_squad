import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductBatch } from '@/modules/inventory-expiry/entities/product-batch.entity';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { StockMovement } from '@/modules/pos-sales/entities/stock-movement.entity';
import { ProductBatchRepository } from '@/modules/inventory-expiry/product-batch.repository';
import { ProductsService } from '@products/products.service';
import { UsersService } from '@users/users.service';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { NotificationType } from '@common/enums/notification.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { AuthUser } from '@common/types/auth-user.type';
import { CreateProductBatchDto } from '@/modules/inventory-expiry/dto/create-product-batch.dto';
import { ListExpiryQueryDto } from '@/modules/inventory-expiry/dto/list-expiry-query.dto';
import {
  ExpiryReport,
  ExpiryReportRow,
} from '@/modules/inventory-expiry/types';
import {
  daysToExpiry,
  severityForDays,
  EXPIRY_WARNING_DAYS,
} from '@/modules/inventory-expiry/lib/expiry-severity';

export interface ExpiryScanSummary {
  branchesAffected: number;
  notificationsSent: number;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

@Injectable()
export class ExpiryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly batches: ProductBatchRepository,
    private readonly products: ProductsService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Receive a goods batch with an expiry date. Inside one transaction: bump the
   * (product, branch) inventory total under a write lock, insert the batch row,
   * and append a `Purchase` stock-movement so the audit ledger stays complete.
   */
  async createBatch(
    dto: CreateProductBatchDto,
    actor: AuthUser,
  ): Promise<ProductBatch> {
    const product = await this.products.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(
        `Product with ID "${dto.productId}" not found`,
      );
    }
    if (product.baseUnit === 'unit' && !Number.isInteger(dto.quantity)) {
      throw new BadRequestException(
        'UNIT stock quantity must be a whole number',
      );
    }

    const branchId = this.resolveWriteBranch(actor, dto.branchId);

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const existing = await invRepo.findOne({
        where: { productId: dto.productId, branchId },
        lock: { mode: 'pessimistic_write' },
      });

      const newQty = round3(
        (existing ? Number(existing.quantity) : 0) + dto.quantity,
      );

      if (existing) {
        existing.quantity = newQty;
        existing.lastRestockedAt = new Date();
        await invRepo.save(existing);
      } else {
        await invRepo.save(
          invRepo.create({
            productId: dto.productId,
            branchId,
            quantity: newQty,
            lowStockThreshold: 10,
            lastRestockedAt: new Date(),
          }),
        );
      }

      const batch = await this.batches.create(
        {
          productId: dto.productId,
          branchId,
          batchNo: dto.batchNo ?? null,
          expiryDate: dto.expiryDate,
          quantity: dto.quantity,
          notes: dto.notes ?? null,
          createdByUserId: actor.id,
        },
        manager,
      );

      const movementRepo = manager.getRepository(StockMovement);
      await movementRepo.save(
        movementRepo.create({
          productId: dto.productId,
          branchId,
          location: 'Shop',
          movementType: 'Purchase',
          qtyIn: dto.quantity,
          qtyOut: 0,
          balanceAfter: newQty,
          refType: 'ProductBatch',
          refId: batch.id,
          notes: dto.batchNo ? `Batch ${dto.batchNo}` : 'Goods receipt',
          createdByUserId: actor.id,
        }),
      );

      return batch;
    });
  }

  /** Expiry report: batches due within `withinDays`, nearest expiry first. */
  async getExpiryReport(
    actor: AuthUser,
    query: ListExpiryQueryDto,
  ): Promise<ExpiryReport> {
    const branchId = this.resolveReadBranch(actor, query.branchId);
    const withinDays = query.withinDays ?? EXPIRY_WARNING_DAYS;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const now = new Date();

    const { items, total } = await this.batches.findExpiring({
      branchId,
      withinDays,
      page,
      limit,
    });

    const rows: ExpiryReportRow[] = items.map((b) => {
      const days = daysToExpiry(b.expiryDate as string, now);
      return {
        batchId: b.id,
        productId: b.productId,
        productName: b.product?.name ?? '',
        barcode: b.product?.barcode ?? '',
        branchId: b.branchId,
        branchName: b.branch?.name ?? '',
        batchNo: b.batchNo,
        expiryDate: b.expiryDate as string,
        quantity: Number(b.quantity),
        daysToExpiry: days,
        severity: severityForDays(days),
      };
    });

    return {
      rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Scan for batches expiring within the warning window and notify the managers
   * of each affected branch plus all admins. On-demand (no scheduler exists
   * yet — a cron-driven scan is a follow-up).
   */
  async scanAndAlert(actor: AuthUser): Promise<ExpiryScanSummary> {
    const branchId = this.resolveReadBranch(actor, undefined);
    const { items } = await this.batches.findExpiring({
      branchId,
      withinDays: EXPIRY_WARNING_DAYS,
      page: 1,
      limit: 1000,
    });

    const countByBranch = new Map<string, number>();
    for (const b of items) {
      countByBranch.set(b.branchId, (countByBranch.get(b.branchId) ?? 0) + 1);
    }

    const admins = await this.users.findAllByRole(UserRole.ADMIN);
    let notificationsSent = 0;

    for (const [bId, count] of countByBranch) {
      const managers = await this.users.findByBranchAndRole(
        bId,
        UserRole.MANAGER,
      );
      const recipients = new Map<string, string>();
      for (const u of [...managers, ...admins]) recipients.set(u.id, u.id);

      const title = 'Expiry alert';
      const message = `${count} batch(es) expiring within ${EXPIRY_WARNING_DAYS} days`;
      for (const userId of recipients.keys()) {
        await this.notifications.create({
          userId,
          title,
          message,
          type: NotificationType.EXPIRY_ALERT,
          metadata: { branchId: bId, count },
        });
        this.gateway.sendToUser(userId, {
          userId,
          title,
          message,
          type: NotificationType.EXPIRY_ALERT,
        });
        notificationsSent += 1;
      }
    }

    return { branchesAffected: countByBranch.size, notificationsSent };
  }

  /** Batches on hand for a product (optionally branch-scoped). */
  listForProduct(actor: AuthUser, productId: string): Promise<ProductBatch[]> {
    const branchId = this.resolveReadBranch(actor, undefined);
    return this.batches.listForProduct(productId, branchId);
  }

  /** Writes are forced to the actor's branch for non-admins. */
  private resolveWriteBranch(actor: AuthUser, requested?: string): string {
    if (actor.role === UserRole.ADMIN) {
      const branchId = requested ?? actor.branchId;
      if (!branchId) {
        throw new BadRequestException('branchId is required for admins');
      }
      return branchId;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    return actor.branchId;
  }

  /** Reads scope to the actor's branch for non-admins; admins may pass one or omit (all). */
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
