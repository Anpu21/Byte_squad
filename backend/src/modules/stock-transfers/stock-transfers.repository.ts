import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
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
  TransferAnalyticsFilter,
  TransferAnalyticsRaw,
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

  async findByIds(ids: string[]): Promise<StockTransferRequest[]> {
    if (ids.length === 0) return [];
    return this.repo.find({
      where: { id: In(ids) },
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
    const qb = this.baseListQb().where('transfer.status IN (:...statuses)', {
      statuses: [TransferStatus.APPROVED, TransferStatus.IN_TRANSIT],
    });
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

  /**
   * Aggregated transfer metrics for the report. Applies the same branch scope
   * as `listHistory` (non-admins see transfers their branch is source OR
   * destination of) plus the optional date range, then runs focused group-by
   * queries for status counts, totals/timings, a per-day series, and the top
   * products.
   */
  async analytics(
    filter: TransferAnalyticsFilter,
  ): Promise<TransferAnalyticsRaw> {
    const scoped = (): SelectQueryBuilder<StockTransferRequest> => {
      const qb = this.repo.createQueryBuilder('transfer');
      if (filter.actorRole !== UserRole.ADMIN) {
        qb.andWhere(
          '(transfer.source_branch_id = :ab OR transfer.destination_branch_id = :ab)',
          { ab: filter.actorBranchId },
        );
      } else if (filter.branchId) {
        qb.andWhere(
          '(transfer.source_branch_id = :b OR transfer.destination_branch_id = :b)',
          { b: filter.branchId },
        );
      }
      if (filter.from) {
        qb.andWhere('transfer.created_at >= :from', { from: filter.from });
      }
      if (filter.to) {
        qb.andWhere('transfer.created_at <= :to', { to: filter.to });
      }
      return qb;
    };

    const statusRows = await scoped()
      .select('transfer.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transfer.status')
      .getRawMany<{ status: TransferStatus; count: string }>();

    const totals = await scoped()
      .setParameter('completed', TransferStatus.COMPLETED)
      .select(
        'COALESCE(SUM(transfer.approved_quantity) FILTER (WHERE transfer.status = :completed), 0)',
        'totalUnits',
      )
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (transfer.reviewed_at - transfer.created_at)) / 3600.0) FILTER (WHERE transfer.reviewed_at IS NOT NULL)',
        'approvalHours',
      )
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (transfer.received_at - transfer.shipped_at)) / 3600.0) FILTER (WHERE transfer.received_at IS NOT NULL AND transfer.shipped_at IS NOT NULL)',
        'fulfilmentHours',
      )
      .getRawOne<{
        totalUnits: string;
        approvalHours: string | null;
        fulfilmentHours: string | null;
      }>();

    const dayExpr = "TO_CHAR(transfer.created_at, 'YYYY-MM-DD')";
    const seriesRows = await scoped()
      .select(dayExpr, 'day')
      .addSelect('COUNT(*)', 'count')
      .groupBy(dayExpr)
      .orderBy(dayExpr, 'ASC')
      .getRawMany<{ day: string; count: string }>();

    const productRows = await scoped()
      .innerJoin('transfer.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('COUNT(*)', 'transfers')
      .addSelect('COALESCE(SUM(transfer.requested_quantity), 0)', 'units')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('COUNT(*)', 'DESC')
      .limit(8)
      .getRawMany<{
        productId: string;
        productName: string;
        transfers: string;
        units: string;
      }>();

    return {
      byStatus: statusRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      totalUnits: Number(totals?.totalUnits ?? 0),
      avgApprovalHours:
        totals?.approvalHours != null ? Number(totals.approvalHours) : null,
      avgFulfilmentHours:
        totals?.fulfilmentHours != null ? Number(totals.fulfilmentHours) : null,
      series: seriesRows.map((r) => ({ day: r.day, count: Number(r.count) })),
      topProducts: productRows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        transfers: Number(r.transfers),
        units: Number(r.units),
      })),
    };
  }
}
