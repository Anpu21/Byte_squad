import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entities/user.entity';
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

export interface SourceOption {
  branchId: string;
  branchName: string;
  isActive: boolean;
  currentQuantity: number;
  lowStockThreshold: number | null;
}

export interface PaginatedTransfers {
  items: StockTransferRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const TRANSFER_RELATIONS = [
  'product',
  'destinationBranch',
  'sourceBranch',
  'requestedBy',
  'reviewedBy',
  'shippedBy',
  'receivedBy',
];

@Injectable()
export class StockTransfersService {
  constructor(
    @InjectRepository(StockTransferRequest)
    private readonly transferRepo: Repository<StockTransferRequest>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly dataSource: DataSource,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  async create(
    dto: CreateTransferRequestDto,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const destBranch = await this.branchRepo.findOne({
      where: { id: actor.branchId },
    });
    if (!destBranch) {
      throw new NotFoundException('Your branch could not be found');
    }

    const draft = this.transferRepo.create({
      productId: dto.productId,
      destinationBranchId: actor.branchId,
      requestedQuantity: dto.requestedQuantity,
      requestReason: dto.requestReason ?? null,
      status: TransferStatus.PENDING,
      requestedByUserId: actor.id,
    });
    const saved = await this.transferRepo.save(draft);

    // Notify all admins
    const admins = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
    });
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

    const qb = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.destinationBranch', 'destinationBranch')
      .leftJoinAndSelect('transfer.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('transfer.requestedBy', 'requestedBy')
      .leftJoinAndSelect('transfer.reviewedBy', 'reviewedBy')
      .leftJoinAndSelect('transfer.shippedBy', 'shippedBy')
      .leftJoinAndSelect('transfer.receivedBy', 'receivedBy')
      .orderBy('transfer.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('transfer.status = :status', { status: query.status });
    }
    if (query.destinationBranchId) {
      qb.andWhere('transfer.destination_branch_id = :destId', {
        destId: query.destinationBranchId,
      });
    }
    if (query.sourceBranchId) {
      qb.andWhere('transfer.source_branch_id = :srcId', {
        srcId: query.sourceBranchId,
      });
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
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async listMyRequests(
    actor: ActorContext,
    query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.destinationBranch', 'destinationBranch')
      .leftJoinAndSelect('transfer.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('transfer.requestedBy', 'requestedBy')
      .leftJoinAndSelect('transfer.reviewedBy', 'reviewedBy')
      .leftJoinAndSelect('transfer.shippedBy', 'shippedBy')
      .leftJoinAndSelect('transfer.receivedBy', 'receivedBy')
      .where('transfer.destination_branch_id = :branchId', {
        branchId: actor.branchId,
      })
      .orderBy('transfer.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('transfer.status = :status', { status: query.status });
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
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async listIncoming(
    actor: ActorContext,
    query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.destinationBranch', 'destinationBranch')
      .leftJoinAndSelect('transfer.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('transfer.requestedBy', 'requestedBy')
      .leftJoinAndSelect('transfer.reviewedBy', 'reviewedBy')
      .leftJoinAndSelect('transfer.shippedBy', 'shippedBy')
      .leftJoinAndSelect('transfer.receivedBy', 'receivedBy')
      .where('transfer.source_branch_id = :branchId', {
        branchId: actor.branchId,
      })
      .andWhere('transfer.status IN (:...statuses)', {
        statuses: [TransferStatus.APPROVED, TransferStatus.IN_TRANSIT],
      })
      .orderBy('transfer.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('transfer.status = :status', { status: query.status });
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
      totalPages: Math.ceil(total / limit) || 1,
    };
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

    const qb = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.destinationBranch', 'destinationBranch')
      .leftJoinAndSelect('transfer.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('transfer.requestedBy', 'requestedBy')
      .leftJoinAndSelect('transfer.reviewedBy', 'reviewedBy')
      .leftJoinAndSelect('transfer.shippedBy', 'shippedBy')
      .leftJoinAndSelect('transfer.receivedBy', 'receivedBy')
      .where('transfer.status IN (:...statuses)', { statuses })
      .orderBy('transfer.createdAt', 'DESC');

    // Managers are auto-scoped to their own branch (source OR destination).
    // Admins see everything by default, with optional branchId filter.
    if (actor.role !== UserRole.ADMIN) {
      qb.andWhere(
        '(transfer.source_branch_id = :actorBranchId OR transfer.destination_branch_id = :actorBranchId)',
        { actorBranchId: actor.branchId },
      );
    } else if (query.branchId) {
      qb.andWhere(
        '(transfer.source_branch_id = :branchId OR transfer.destination_branch_id = :branchId)',
        { branchId: query.branchId },
      );
    }

    if (query.productId) {
      qb.andWhere('transfer.product_id = :productId', {
        productId: query.productId,
      });
    }
    if (query.from) {
      qb.andWhere('transfer.created_at >= :from', { from: query.from });
    }
    if (query.to) {
      // Treat `to` as inclusive end-of-day.
      const endOfDay = new Date(query.to);
      endOfDay.setUTCHours(23, 59, 59, 999);
      qb.andWhere('transfer.created_at <= :to', { to: endOfDay });
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
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(
    id: string,
    actor: ActorContext,
  ): Promise<StockTransferRequest> {
    const transfer = await this.findByIdOrThrow(id);

    // Admins see everything; managers/cashiers only see transfers
    // where their branch is source or destination.
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

    const branches = await this.branchRepo.find({
      order: { name: 'ASC' },
    });

    const inventoryRows = await this.inventoryRepo.find({
      where: {
        productId: transfer.productId,
        branchId: In(branches.map((b) => b.id)),
      },
    });
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

    // Sort by surplus (current quantity) descending so the best options
    // surface first.
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

    const sourceBranch = await this.branchRepo.findOne({
      where: { id: dto.sourceBranchId },
    });
    if (!sourceBranch) {
      throw new NotFoundException('Source branch not found');
    }
    if (!sourceBranch.isActive) {
      throw new BadRequestException('Source branch is inactive');
    }

    // Advisory check — the binding check happens at ship time.
    const sourceInventory = await this.inventoryRepo.findOne({
      where: {
        productId: transfer.productId,
        branchId: dto.sourceBranchId,
      },
    });
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
    await this.transferRepo.save(transfer);

    const updated = await this.findByIdOrThrow(id);

    // Notify source branch managers + destination branch managers
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
    await this.transferRepo.save(transfer);

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
    await this.transferRepo.save(transfer);

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
      // with concurrent POS sales or restocks.
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
    const transfer = await this.transferRepo.findOne({
      where: { id },
      relations: TRANSFER_RELATIONS,
    });
    if (!transfer) {
      throw new NotFoundException('Transfer request not found');
    }
    return transfer;
  }

  private async collectBranchManagers(branchIds: string[]): Promise<User[]> {
    const ids = branchIds.filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];
    return this.userRepo.find({
      where: {
        branchId: In(ids),
        role: In([UserRole.ADMIN, UserRole.MANAGER]),
      },
    });
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
