import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { TransferStatus } from '@common/enums/transfer-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

const TRANSFER_RELATIONS = [
  'product',
  'destinationBranch',
  'sourceBranch',
  'requestedBy',
  'reviewedBy',
  'shippedBy',
  'receivedBy',
];

import {
  PaginatedTransfersRaw,
  ListAdminFilter,
  ListMineFilter,
  ListIncomingFilter,
  ListHistoryFilter,
} from '@stock-transfers/types';

@Injectable()
export class StockTransfersRepository {
  constructor(
    @InjectRepository(StockTransferRequest)
    private readonly repo: Repository<StockTransferRequest>,
  ) {}

  async create(
    partial: Partial<StockTransferRequest>,
  ): Promise<StockTransferRequest> {
    return this.repo.save(this.repo.create(partial));
  }

  async save(transfer: StockTransferRequest): Promise<StockTransferRequest> {
    return this.repo.save(transfer);
  }

  async findById(id: string): Promise<StockTransferRequest | null> {
    return this.repo.findOne({
      where: { id },
      relations: TRANSFER_RELATIONS,
    });
  }

  private baseListQb() {
    return this.repo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.destinationBranch', 'destinationBranch')
      .leftJoinAndSelect('transfer.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('transfer.requestedBy', 'requestedBy')
      .leftJoinAndSelect('transfer.reviewedBy', 'reviewedBy')
      .leftJoinAndSelect('transfer.shippedBy', 'shippedBy')
      .leftJoinAndSelect('transfer.receivedBy', 'receivedBy')
      .orderBy('transfer.createdAt', 'DESC');
  }

  async listForAdmin(filter: ListAdminFilter): Promise<PaginatedTransfersRaw> {
    const qb = this.baseListQb();
    if (filter.status) {
      qb.andWhere('transfer.status = :status', { status: filter.status });
    }
    if (filter.destinationBranchId) {
      qb.andWhere('transfer.destination_branch_id = :destId', {
        destId: filter.destinationBranchId,
      });
    }
    if (filter.sourceBranchId) {
      qb.andWhere('transfer.source_branch_id = :srcId', {
        srcId: filter.sourceBranchId,
      });
    }
    const [items, total] = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();
    return { items, total };
  }

  async listMyRequests(filter: ListMineFilter): Promise<PaginatedTransfersRaw> {
    const qb = this.baseListQb();
    if (filter.branchId !== null) {
      qb.where('transfer.destination_branch_id = :branchId', {
        branchId: filter.branchId,
      });
    }
    if (filter.status) {
      qb.andWhere('transfer.status = :status', { status: filter.status });
    }
    const [items, total] = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();
    return { items, total };
  }

  async listIncoming(
    filter: ListIncomingFilter,
  ): Promise<PaginatedTransfersRaw> {
    const qb = this.baseListQb().where(
      'transfer.status IN (:...statuses)',
      { statuses: [TransferStatus.APPROVED, TransferStatus.IN_TRANSIT] },
    );
    if (filter.branchId !== null) {
      qb.andWhere('transfer.source_branch_id = :branchId', {
        branchId: filter.branchId,
      });
    }
    if (filter.status) {
      qb.andWhere('transfer.status = :status', { status: filter.status });
    }
    const [items, total] = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();
    return { items, total };
  }

  async listHistory(filter: ListHistoryFilter): Promise<PaginatedTransfersRaw> {
    const qb = this.baseListQb().where('transfer.status IN (:...statuses)', {
      statuses: filter.statuses,
    });

    if (filter.actorRole !== UserRole.ADMIN) {
      qb.andWhere(
        '(transfer.source_branch_id = :actorBranchId OR transfer.destination_branch_id = :actorBranchId)',
        { actorBranchId: filter.actorBranchId },
      );
    } else if (filter.branchId) {
      qb.andWhere(
        '(transfer.source_branch_id = :branchId OR transfer.destination_branch_id = :branchId)',
        { branchId: filter.branchId },
      );
    }

    if (filter.productId) {
      qb.andWhere('transfer.product_id = :productId', {
        productId: filter.productId,
      });
    }
    if (filter.from) {
      qb.andWhere('transfer.created_at >= :from', { from: filter.from });
    }
    if (filter.to) {
      const endOfDay = new Date(filter.to);
      endOfDay.setUTCHours(23, 59, 59, 999);
      qb.andWhere('transfer.created_at <= :to', { to: endOfDay });
    }

    const [items, total] = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();
    return { items, total };
  }
}
