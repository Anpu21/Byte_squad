import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { StockAdjustment } from '@/modules/inventory-adjustments/entities/stock-adjustment.entity';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { StockMovement } from '@/modules/pos-sales/entities/stock-movement.entity';
import { StockAdjustmentRepository } from '@/modules/inventory-adjustments/stock-adjustment.repository';
import { ProductsService } from '@products/products.service';
import { UsersService } from '@users/users.service';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationType } from '@common/enums/notification.enum';
import { StockAdjustmentStatus } from '@common/enums/stock-adjustment-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { AuthUser } from '@common/types/auth-user.type';
import { CreateStockAdjustmentDto } from '@/modules/inventory-adjustments/dto/create-stock-adjustment.dto';
import { ListStockAdjustmentsQueryDto } from '@/modules/inventory-adjustments/dto/list-stock-adjustments-query.dto';
import { PaginatedStockAdjustments } from '@/modules/inventory-adjustments/types';

/**
 * Absolute |difference| above which a MANAGER's adjustment requires admin
 * approval. Admin adjustments always apply immediately.
 */
export const ADJUSTMENT_APPROVAL_THRESHOLD = 100;

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

@Injectable()
export class StockAdjustmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly adjustments: StockAdjustmentRepository,
    private readonly products: ProductsService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateStockAdjustmentDto,
    actor: AuthUser,
  ): Promise<StockAdjustment> {
    const product = await this.products.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(
        `Product with ID "${dto.productId}" not found`,
      );
    }
    if (
      product.baseUnit === 'unit' &&
      !Number.isInteger(dto.physicalQuantity)
    ) {
      throw new BadRequestException(
        'UNIT stock quantity must be a whole number',
      );
    }
    const branchId = this.resolveWriteBranch(actor, dto.branchId);

    const inv = await this.dataSource
      .getRepository(Inventory)
      .findOne({ where: { productId: dto.productId, branchId } });
    const before = inv ? Number(inv.quantity) : 0;
    const difference = round3(dto.physicalQuantity - before);

    const needsApproval =
      actor.role !== UserRole.ADMIN &&
      Math.abs(difference) > ADJUSTMENT_APPROVAL_THRESHOLD;

    if (needsApproval) {
      const pending = this.adjustments.create({
        productId: dto.productId,
        branchId,
        reason: dto.reason,
        status: StockAdjustmentStatus.PENDING,
        quantityBefore: before,
        physicalQuantity: dto.physicalQuantity,
        difference,
        notes: dto.notes ?? null,
        createdByUserId: actor.id,
      });
      const saved = await this.adjustments.save(pending);
      await this.notifyAdminsOfPending(saved, product.name);
      return saved;
    }

    return this.dataSource.transaction((manager) => {
      const adjustment = this.adjustments.create({
        productId: dto.productId,
        branchId,
        reason: dto.reason,
        physicalQuantity: dto.physicalQuantity,
        notes: dto.notes ?? null,
        createdByUserId: actor.id,
        quantityBefore: before,
        difference,
        status: StockAdjustmentStatus.APPROVED,
      });
      return this.applyToInventory(manager, adjustment, actor);
    });
  }

  /** Admin approves a pending adjustment — applies it to inventory now. */
  async approve(id: string, actor: AuthUser): Promise<StockAdjustment> {
    const adjustment = await this.adjustments.findById(id);
    if (!adjustment) {
      throw new NotFoundException(`Stock adjustment "${id}" not found`);
    }
    if (adjustment.status !== StockAdjustmentStatus.PENDING) {
      throw new ConflictException('Only pending adjustments can be approved');
    }
    return this.dataSource.transaction((manager) =>
      this.applyToInventory(manager, adjustment, actor),
    );
  }

  /** Admin reverses an approved adjustment — undoes the delta + audit row. */
  async reverse(id: string, actor: AuthUser): Promise<StockAdjustment> {
    const adjustment = await this.adjustments.findById(id);
    if (!adjustment) {
      throw new NotFoundException(`Stock adjustment "${id}" not found`);
    }
    if (adjustment.status !== StockAdjustmentStatus.APPROVED) {
      throw new ConflictException('Only approved adjustments can be reversed');
    }

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const existing = await invRepo.findOne({
        where: {
          productId: adjustment.productId,
          branchId: adjustment.branchId,
        },
        lock: { mode: 'pessimistic_write' },
      });
      const current = existing ? Number(existing.quantity) : 0;
      const reverted = round3(current - Number(adjustment.difference));

      if (existing) {
        existing.quantity = reverted;
        await invRepo.save(existing);
      } else {
        await invRepo.save(
          invRepo.create({
            productId: adjustment.productId,
            branchId: adjustment.branchId,
            quantity: reverted,
            lowStockThreshold: 10,
          }),
        );
      }

      adjustment.status = StockAdjustmentStatus.REVERSED;
      adjustment.reversedByUserId = actor.id;
      adjustment.reversedAt = new Date();
      const saved = await this.adjustments.save(adjustment, manager);

      const diff = Number(adjustment.difference);
      const movementRepo = manager.getRepository(StockMovement);
      await movementRepo.save(
        movementRepo.create({
          productId: adjustment.productId,
          branchId: adjustment.branchId,
          location: 'Shop',
          movementType: 'Adjustment',
          qtyIn: diff < 0 ? -diff : 0,
          qtyOut: diff > 0 ? diff : 0,
          balanceAfter: reverted,
          refType: 'StockAdjustment',
          refId: saved.id,
          notes: `Reversal of adjustment ${saved.id}`,
          createdByUserId: actor.id,
        }),
      );

      return saved;
    });
  }

  async listForBranch(
    actor: AuthUser,
    query: ListStockAdjustmentsQueryDto,
  ): Promise<PaginatedStockAdjustments> {
    const branchId = this.resolveReadBranch(actor, query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.adjustments.listForBranch({
      branchId,
      status: query.status,
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

  /**
   * Lock the inventory row, set it to the counted physical quantity, persist
   * the adjustment as Approved, and append an `Adjustment` movement row.
   */
  private async applyToInventory(
    manager: EntityManager,
    adjustment: StockAdjustment,
    actor: AuthUser,
  ): Promise<StockAdjustment> {
    const invRepo = manager.getRepository(Inventory);
    const existing = await invRepo.findOne({
      where: { productId: adjustment.productId, branchId: adjustment.branchId },
      lock: { mode: 'pessimistic_write' },
    });
    const before = existing ? Number(existing.quantity) : 0;
    const physical = Number(adjustment.physicalQuantity);
    const difference = round3(physical - before);

    if (existing) {
      existing.quantity = physical;
      await invRepo.save(existing);
    } else {
      await invRepo.save(
        invRepo.create({
          productId: adjustment.productId,
          branchId: adjustment.branchId,
          quantity: physical,
          lowStockThreshold: 10,
        }),
      );
    }

    adjustment.quantityBefore = before;
    adjustment.difference = difference;
    adjustment.status = StockAdjustmentStatus.APPROVED;
    adjustment.reviewedByUserId = actor.id;
    adjustment.reviewedAt = new Date();
    const saved = await this.adjustments.save(adjustment, manager);

    const movementRepo = manager.getRepository(StockMovement);
    await movementRepo.save(
      movementRepo.create({
        productId: adjustment.productId,
        branchId: adjustment.branchId,
        location: 'Shop',
        movementType: 'Adjustment',
        qtyIn: difference > 0 ? difference : 0,
        qtyOut: difference < 0 ? -difference : 0,
        balanceAfter: physical,
        refType: 'StockAdjustment',
        refId: saved.id,
        notes: adjustment.notes
          ? `${adjustment.reason}: ${adjustment.notes}`
          : adjustment.reason,
        createdByUserId: actor.id,
      }),
    );

    return saved;
  }

  private async notifyAdminsOfPending(
    adjustment: StockAdjustment,
    productName: string,
  ): Promise<void> {
    const admins = await this.users.findAllByRole(UserRole.ADMIN);
    for (const admin of admins) {
      await this.notifications.create({
        userId: admin.id,
        title: 'Stock adjustment pending',
        message: `${productName}: ${adjustment.reason} adjustment awaiting approval`,
        type: NotificationType.ALERT,
        metadata: { adjustmentId: adjustment.id },
      });
    }
  }

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
