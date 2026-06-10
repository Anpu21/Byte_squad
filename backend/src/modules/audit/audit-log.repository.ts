import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { AuditLog } from '@/modules/audit/entities/audit-log.entity';

export interface ListAuditLogsOptions {
  userId?: string;
  method?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

export interface PagedAuditLogs {
  rows: AuditLog[];
  total: number;
}

/** Audit-log repository (Rules.md §7) — append + filtered reads. */
@Injectable()
export class AuditLogRepository {
  private readonly logs: Repository<AuditLog>;

  constructor(private readonly dataSource: DataSource) {
    this.logs = dataSource.getRepository(AuditLog);
  }

  async insert(partial: DeepPartial<AuditLog>): Promise<void> {
    await this.logs.insert(this.logs.create(partial));
  }

  async list(opts: ListAuditLogsOptions): Promise<PagedAuditLogs> {
    const qb = this.logs.createQueryBuilder('al');
    if (opts.userId) {
      qb.andWhere('al.user_id = :userId', { userId: opts.userId });
    }
    if (opts.method) {
      qb.andWhere('al.method = :method', { method: opts.method });
    }
    if (opts.search) {
      qb.andWhere('al.path ILIKE :search', { search: `%${opts.search}%` });
    }
    if (opts.startDate) {
      qb.andWhere('al.created_at >= :start', {
        start: new Date(`${opts.startDate}T00:00:00`),
      });
    }
    if (opts.endDate) {
      qb.andWhere('al.created_at <= :end', {
        end: new Date(`${opts.endDate}T23:59:59.999`),
      });
    }
    const [rows, total] = await qb
      .orderBy('al.created_at', 'DESC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }
}
