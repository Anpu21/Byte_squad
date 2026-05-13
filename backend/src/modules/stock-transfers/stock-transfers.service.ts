import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { User } from '@users/entities/user.entity';
import { StockTransfersRepository } from '@stock-transfers/stock-transfers.repository';
import { ProductsRepository } from '@products/products.repository';
import { BranchesRepository } from '@branches/branches.repository';
import { InventoryRepository } from '@inventory/inventory.repository';
import { UsersRepository } from '@users/users.repository';
import { CreateTransferRequestDto } from '@stock-transfers/dto/create-transfer-request.dto';
import { ApproveTransferDto } from '@stock-transfers/dto/approve-transfer.dto';
import { RejectTransferDto } from '@stock-transfers/dto/reject-transfer.dto';
import { ListTransfersQueryDto } from '@stock-transfers/dto/list-transfers-query.dto';
import {
  HISTORY_TERMINAL_STATUSES,
  ListTransferHistoryQueryDto,
} from '@stock-transfers/dto/list-transfer-history-query.dto';
import { TransferStatus } from '@common/enums/transfer-status.enum';
import { NotificationType } from '@common/enums/notification.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';

interface ActorContext {
  id: string;
  branchId: string;
  role: UserRole;
}

import { SourceOption, PaginatedTransfers } from '@stock-transfers/types';

// Re-export so existing callers that imported these from this file keep working.
export type { SourceOption, PaginatedTransfers };

function paginate<T>(
  raw: { items: T[]; total: number },
  page: number,
  limit: number,
): PaginatedTransfers {
  return {
    items: raw.items as StockTransferRequest[],
    total: raw.total,
    page,
    limit,
    totalPages: Math.ceil(raw.total / limit) || 1,
  };
}

@Injectable()
export class StockTransfersService {
  constructor(
    private readonly transfers: StockTransfersRepository,
    private readonly products: ProductsRepository,
    private readonly branches: BranchesRepository,
    private readonly inventory: InventoryRepository,
    private readonly users: UsersRepository,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    // Service-level transactions still need a DataSource — repos run in
    // the OUTER transaction's EntityManager via manager.getRepository().
    private readonly dataSource: DataSource,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  async create(
    dto: CreateTransferRequestDto,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const product = await this.products.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const destBranch = await this.branches.findById(actor.branchId);
    if (!destBranch) {
      throw new NotFoundException('Your branch could not be found');
    }

    const saved = await this.transfers.create({
      productId: dto.productId,
      destinationBranchId: actor.branchId,
      requestedQuantity: dto.requestedQuantity,
      requestReason: dto.requestReason ?? null,
      status: TransferStatus.PENDING,
      requestedByUserId: actor.id,
    });

    const admins = await this.users.findAllByRole(UserRole.ADMIN);
    const message = `${destBranch.name} requests ${dto.requestedQuantity} unit(s) of ${product.name}`;
    await Promise.all(
      admins.map((admin) =>
        this.notifyUser(admin.id, {
          title: 'New stock transfer request',
          message,
          metadata: {
            event: 'created',
            transferId: saved.id,
            productName: product.name,
            destinationBranchName: destBranch.name,
            quantity: dto.requestedQuantity,
          },
        }),
      ),
    );

    return this.findByIdOrThrow(saved.id);
  }

  async listForAdmin(
    query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const raw = await this.transfers.listForAdmin({
      status: query.status,
      destinationBranchId: query.destinationBranchId,
      sourceBranchId: query.sourceBranchId,
      page,
      limit,
    });
    return paginate(raw, page, limit);
  }

  async listMyRequests(
    actor: ActorContext,
    query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const raw = await this.transfers.listMyRequests({
      branchId: actor.branchId,
      status: query.status,
      page,
      limit,
    });
    return paginate(raw, page, limit);
  }

  async listIncoming(
    actor: ActorContext,
    query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const raw = await this.transfers.listIncoming({
      branchId: actor.branchId,
      status: query.status,
      page,
      limit,
    });
    return paginate(raw, page, limit);
  }

  async listHistory(
    actor: ActorContext,
    query: ListTransferHistoryQueryDto,
  ): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const statuses =
      query.status && query.status.length > 0
        ? query.status
        : HISTORY_TERMINAL_STATUSES;

    const raw = await this.transfers.listHistory({
      actorRole: actor.role,
      actorBranchId: actor.branchId,
      branchId: query.branchId,
      productId: query.productId,
      from: query.from,
      to: query.to,
      statuses,
      page,
      limit,
    });
    return paginate(raw, page, limit);
  }

  async findById(
    id: string,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);

    if (actor.role !== UserRole.ADMIN) {
      const allowed =
        transfer.destinationBranchId === actor.branchId ||
        transfer.sourceBranchId === actor.branchId;
      if (!allowed) {
        throw new ForbiddenException('You do not have access to this transfer');
      }
    }
    return transfer;
  }

  async getSourceOptions(id: string): Promise<SourceOption[]> {
    const transfer = await this.findByIdOrThrow(id);
    const branches = await this.branches.findAllSortedByName();
    const branchIds = branches.map((b) => b.id);
    const inventoryRows = await this.inventory.findByProductInBranches(
      transfer.productId,
      branchIds,
    );
    const inventoryByBranch = new Map(
      inventoryRows.map((row) => [row.branchId, row]),
    );

    const options: SourceOption[] = branches
      .filter((b) => b.id !== transfer.destinationBranchId)
      .map((branch) => {
        const row = inventoryByBranch.get(branch.id);
        return {
          branchId: branch.id,
          branchName: branch.name,
          isActive: branch.isActive,
          currentQuantity: row?.quantity ?? 0,
          lowStockThreshold: row?.lowStockThreshold ?? null,
        };
      });

    options.sort((a, b) => b.currentQuantity - a.currentQuantity);
    return options;
  }

  async approve(
    id: string,
    dto: ApproveTransferDto,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve a transfer in status "${transfer.status}"`,
      );
    }
    if (dto.sourceBranchId === transfer.destinationBranchId) {
      throw new BadRequestException(
        'Source branch must be different from destination branch',
      );
    }
    if (dto.approvedQuantity > transfer.requestedQuantity) {
      throw new BadRequestException(
        'Approved quantity cannot exceed requested quantity',
      );
    }

    const sourceBranch = await this.branches.findById(dto.sourceBranchId);
    if (!sourceBranch) {
      throw new NotFoundException('Source branch not found');
    }
    if (!sourceBranch.isActive) {
      throw new BadRequestException('Source branch is inactive');
    }

    // Advisory check — the binding check happens at ship time inside a
    // pessimistic lock.
    const sourceInventory = await this.inventory.findByProductAndBranch(
      transfer.productId,
      dto.sourceBranchId,
    );
    if (!sourceInventory || sourceInventory.quantity < dto.approvedQuantity) {
      throw new BadRequestException(
        'Source branch does not currently have enough stock to fulfill this transfer',
      );
    }

    const trimmedNote = dto.approvalNote?.trim();
    transfer.status = TransferStatus.APPROVED;
    transfer.sourceBranchId = dto.sourceBranchId;
    transfer.approvedQuantity = dto.approvedQuantity;
    transfer.approvalNote = trimmedNote ? trimmedNote : null;
    transfer.reviewedByUserId = actor.id;
    transfer.reviewedAt = new Date();
    await this.transfers.save(transfer);

    const updated = await this.findByIdOrThrow(id);

    const recipients = await this.collectBranchManagers([
      dto.sourceBranchId,
      transfer.destinationBranchId,
    ]);
    const productName = updated.product.name;
    const baseMessage = `Approved: ${dto.approvedQuantity} unit(s) of ${productName} from ${sourceBranch.name} to ${updated.destinationBranch.name}`;
    const message = trimmedNote
      ? `${baseMessage} — Admin note: ${trimmedNote}`
      : baseMessage;
    await Promise.all(
      recipients.map((user) =>
        this.notifyUser(user.id, {
          title: 'Stock transfer approved',
          message,
          metadata: {
            event: 'approved',
            transferId: id,
            productName,
            sourceBranchName: sourceBranch.name,
            destinationBranchName: updated.destinationBranch.name,
            quantity: dto.approvedQuantity,
            approvalNote: trimmedNote ?? null,
          },
        }),
      ),
    );

    return updated;
  }

  async reject(
    id: string,
    dto: RejectTransferDto,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a transfer in status "${transfer.status}"`,
      );
    }

    transfer.status = TransferStatus.REJECTED;
    transfer.rejectionReason = dto.rejectionReason;
    transfer.reviewedByUserId = actor.id;
    transfer.reviewedAt = new Date();
    await this.transfers.save(transfer);

    const updated = await this.findByIdOrThrow(id);

    const recipients = await this.collectBranchManagers([
      transfer.destinationBranchId,
    ]);
    const message = `Your request for ${transfer.requestedQuantity} unit(s) of ${updated.product.name} was rejected: ${dto.rejectionReason}`;
    await Promise.all(
      recipients.map((user) =>
        this.notifyUser(user.id, {
          title: 'Stock transfer rejected',
          message,
          metadata: {
            event: 'rejected',
            transferId: id,
            productName: updated.product.name,
            rejectionReason: dto.rejectionReason,
          },
        }),
      ),
    );

    return updated;
  }

  async cancel(id: string, actor: ActorContext): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);
    if (
      transfer.status !== TransferStatus.PENDING &&
      transfer.status !== TransferStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot cancel a transfer in status "${transfer.status}"`,
      );
    }

    transfer.status = TransferStatus.CANCELLED;
    transfer.reviewedByUserId = actor.id;
    transfer.reviewedAt = new Date();
    await this.transfers.save(transfer);

    const updated = await this.findByIdOrThrow(id);

    const branchIds = [transfer.destinationBranchId];
    if (transfer.sourceBranchId) {
      branchIds.push(transfer.sourceBranchId);
    }
    const recipients = await this.collectBranchManagers(branchIds);
    const message = `Transfer for ${updated.product.name} was cancelled by an administrator`;
    await Promise.all(
      recipients.map((user) =>
        this.notifyUser(user.id, {
          title: 'Stock transfer cancelled',
          message,
          metadata: {
            event: 'cancelled',
            transferId: id,
            productName: updated.product.name,
          },
        }),
      ),
    );

    return updated;
  }

  async ship(id: string, actor: ActorContext): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot ship a transfer in status "${transfer.status}"`,
      );
    }
    if (!transfer.sourceBranchId || transfer.approvedQuantity == null) {
      throw new BadRequestException(
        'Transfer is missing source branch or approved quantity',
      );
    }
    if (
      actor.role !== UserRole.ADMIN &&
      actor.branchId !== transfer.sourceBranchId
    ) {
      throw new ForbiddenException(
        'Only the source branch can ship this transfer',
      );
    }

    const approvedQuantity = transfer.approvedQuantity;
    const sourceBranchId = transfer.sourceBranchId;

    await this.dataSource.transaction(async (manager) => {
      // Pessimistic lock on the source inventory row to prevent races
      // with concurrent POS sales or restocks. Repo-class methods can't
      // accept the outer EntityManager yet, so this uses raw access.
      const sourceInventory = await manager
        .getRepository(Inventory)
        .createQueryBuilder('inv')
        .setLock('pessimistic_write')
        .where('inv.product_id = :productId', {
          productId: transfer.productId,
        })
        .andWhere('inv.branch_id = :branchId', { branchId: sourceBranchId })
        .getOne();

      if (!sourceInventory) {
        throw new BadRequestException(
          'Source branch no longer has an inventory record for this product',
        );
      }
      if (sourceInventory.quantity < approvedQuantity) {
        throw new BadRequestException(
          `Source branch only has ${sourceInventory.quantity} unit(s) — cannot ship ${approvedQuantity}`,
        );
      }

      sourceInventory.quantity -= approvedQuantity;
      await manager.getRepository(Inventory).save(sourceInventory);

      transfer.status = TransferStatus.IN_TRANSIT;
      transfer.shippedByUserId = actor.id;
      transfer.shippedAt = new Date();
      await manager.getRepository(StockTransferRequest).save(transfer);
    });

    const updated = await this.findByIdOrThrow(id);

    const recipients = await this.collectBranchManagers([
      transfer.destinationBranchId,
    ]);
    const message = `${approvedQuantity} unit(s) of ${updated.product.name} are on the way from ${updated.sourceBranch?.name ?? 'source branch'}`;
    await Promise.all(
      recipients.map((user) =>
        this.notifyUser(user.id, {
          title: 'Stock transfer shipped',
          message,
          metadata: {
            event: 'shipped',
            transferId: id,
            productName: updated.product.name,
            quantity: approvedQuantity,
          },
        }),
      ),
    );

    return updated;
  }

  async receive(
    id: string,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException(
        `Cannot receive a transfer in status "${transfer.status}"`,
      );
    }
    if (transfer.approvedQuantity == null) {
      throw new BadRequestException('Transfer is missing approved quantity');
    }
    if (
      actor.role !== UserRole.ADMIN &&
      actor.branchId !== transfer.destinationBranchId
    ) {
      throw new ForbiddenException(
        'Only the destination branch can receive this transfer',
      );
    }

    const approvedQuantity = transfer.approvedQuantity;

    await this.dataSource.transaction(async (manager) => {
      const inventoryRepo = manager.getRepository(Inventory);

      let destInventory = await inventoryRepo
        .createQueryBuilder('inv')
        .setLock('pessimistic_write')
        .where('inv.product_id = :productId', {
          productId: transfer.productId,
        })
        .andWhere('inv.branch_id = :branchId', {
          branchId: transfer.destinationBranchId,
        })
        .getOne();

      if (!destInventory) {
        destInventory = inventoryRepo.create({
          productId: transfer.productId,
          branchId: transfer.destinationBranchId,
          quantity: approvedQuantity,
          lowStockThreshold: 10,
          lastRestockedAt: new Date(),
        });
      } else {
        destInventory.quantity += approvedQuantity;
        destInventory.lastRestockedAt = new Date();
      }
      await inventoryRepo.save(destInventory);

      transfer.status = TransferStatus.COMPLETED;
      transfer.receivedByUserId = actor.id;
      transfer.receivedAt = new Date();
      await manager.getRepository(StockTransferRequest).save(transfer);
    });

    const updated = await this.findByIdOrThrow(id);

    const recipients = transfer.sourceBranchId
      ? await this.collectBranchManagers([transfer.sourceBranchId])
      : [];
    const message = `${updated.destinationBranch.name} received ${approvedQuantity} unit(s) of ${updated.product.name}`;
    await Promise.all(
      recipients.map((user) =>
        this.notifyUser(user.id, {
          title: 'Stock transfer completed',
          message,
          metadata: {
            event: 'received',
            transferId: id,
            productName: updated.product.name,
            quantity: approvedQuantity,
          },
        }),
      ),
    );

    return updated;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string): Promise<StockTransferRequest> {
    const transfer = await this.transfers.findById(id);
    if (!transfer) {
      throw new NotFoundException('Transfer request not found');
    }
    return transfer;
  }

  private async collectBranchManagers(branchIds: string[]): Promise<User[]> {
    const ids = branchIds.filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];
    return this.users.findManagersAndAdminsForBranches(ids);
  }

  private async notifyUser(
    userId: string,
    payload: {
      title: string;
      message: string;
      metadata: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.notificationsService.create({
      userId,
      title: payload.title,
      message: payload.message,
      type: NotificationType.STOCK_TRANSFER,
      metadata: payload.metadata,
    });
    this.notificationsGateway.sendToUser(userId, {
      userId,
      title: payload.title,
      message: payload.message,
      type: NotificationType.STOCK_TRANSFER,
    });
  }
}

