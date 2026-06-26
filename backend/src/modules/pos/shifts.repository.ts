import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { PosShift } from '@pos/entities/pos-shift.entity';
import type { ShiftStatus } from '@pos/types/shift-status.type';

export interface ListShiftsOptions {
  branchId?: string;
  cashierId?: string;
  status?: ShiftStatus;
  limit: number;
  offset: number;
}

export interface PagedShifts {
  rows: PosShift[];
  total: number;
}

export interface TenderTotalsRaw {
  cash: number;
  cheque: number;
  bank: number;
  credit: number;
  electronic: number;
}

/**
 * Shift repository (Rules.md R7). Also owns the window aggregates the
 * Z-report needs: tender totals come from the payments join, sale
 * count/total from sales alone (so payment-row cardinality can never
 * double-count), refunds from sales_returns by the same cashier.
 */
@Injectable()
export class ShiftsRepository {
  private readonly shifts: Repository<PosShift>;

  constructor(private readonly dataSource: DataSource) {
    this.shifts = dataSource.getRepository(PosShift);
  }

  async findOpenForCashier(cashierId: string): Promise<PosShift | null> {
    return this.shifts.findOne({ where: { cashierId, status: 'Open' } });
  }

  async findById(id: string): Promise<PosShift | null> {
    return this.shifts.findOne({
      where: { id },
      relations: ['branch', 'cashier'],
    });
  }

  async insert(partial: DeepPartial<PosShift>): Promise<PosShift> {
    return this.shifts.save(this.shifts.create(partial));
  }

  async update(id: string, partial: DeepPartial<PosShift>): Promise<void> {
    await this.shifts.update(id, partial);
  }

  async list(opts: ListShiftsOptions): Promise<PagedShifts> {
    const qb = this.shifts
      .createQueryBuilder('sh')
      .leftJoinAndSelect('sh.branch', 'branch')
      .leftJoinAndSelect('sh.cashier', 'cashier');
    if (opts.branchId) {
      qb.andWhere('sh.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.cashierId) {
      qb.andWhere('sh.cashier_id = :cashierId', {
        cashierId: opts.cashierId,
      });
    }
    if (opts.status) {
      qb.andWhere('sh.status = :status', { status: opts.status });
    }
    const [rows, total] = await qb
      .orderBy('sh.openedAt', 'DESC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }

  async tenderTotalsForWindow(
    cashierId: string,
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<TenderTotalsRaw> {
    const raw: Array<{
      cash: string;
      cheque: string;
      bank: string;
      credit: string;
      electronic: string;
    }> = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(p.cash_amount), 0) AS cash,
        COALESCE(SUM(p.cheque_amount), 0) AS cheque,
        COALESCE(SUM(p.bank_transfer_amount), 0) AS bank,
        COALESCE(SUM(p.credit_amount), 0) AS credit,
        COALESCE(SUM(GREATEST(
          p.payment_amount - p.cash_amount - p.cheque_amount
            - p.bank_transfer_amount - p.credit_amount, 0)), 0) AS electronic
      FROM payments p
      JOIN sales s ON s.id = p.sale_id
      WHERE p.status = 'Active'
        AND s.status = 'Active'
        AND s.cashier_id = $1
        AND s.branch_id = $2
        AND s.created_at >= $3
        AND s.created_at <= $4
      `,
      [cashierId, branchId, start, end],
    );
    const row = raw[0];
    return {
      cash: Number(row?.cash ?? 0),
      cheque: Number(row?.cheque ?? 0),
      bank: Number(row?.bank ?? 0),
      credit: Number(row?.credit ?? 0),
      electronic: Number(row?.electronic ?? 0),
    };
  }

  async salesTotalsForWindow(
    cashierId: string,
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<{ salesCount: number; salesTotal: number }> {
    const raw: Array<{ cnt: string; total: string }> =
      await this.dataSource.query(
        `
      SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS total
      FROM sales
      WHERE status = 'Active'
        AND cashier_id = $1
        AND branch_id = $2
        AND created_at >= $3
        AND created_at <= $4
      `,
        [cashierId, branchId, start, end],
      );
    return {
      salesCount: Number(raw[0]?.cnt ?? 0),
      salesTotal: Number(raw[0]?.total ?? 0),
    };
  }

  async refundsForWindow(
    cashierId: string,
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const raw: Array<{ total: string }> = await this.dataSource.query(
      `
      SELECT COALESCE(SUM(total_refund_amount), 0) AS total
      FROM sales_returns
      WHERE created_by_user_id = $1
        AND branch_id = $2
        AND created_at >= $3
        AND created_at <= $4
      `,
      [cashierId, branchId, start, end],
    );
    return Number(raw[0]?.total ?? 0);
  }
}
