import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { PosShift } from '@pos/entities/pos-shift.entity';
import { ShiftsRepository } from '@pos/shifts.repository';
import { OpenShiftDto } from '@pos/dto/open-shift.dto';
import { CloseShiftDto } from '@pos/dto/close-shift.dto';
import { ListShiftsQueryDto } from '@pos/dto/list-shifts-query.dto';
import type { ShiftLiveSummary } from '@pos/types/shift-live-summary.type';

export interface ShiftsActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface CurrentShiftResponse {
  shift: PosShift | null;
  live: ShiftLiveSummary | null;
}

export interface ShiftsListResponse {
  rows: PosShift[];
  total: number;
  limit: number;
  offset: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Drawer sessions + the day-end Z-report. One open shift per cashier;
 * closing snapshots the window's tender totals and reconciles the drawer:
 * expectedCash = openingFloat + cash takings − refunds (refunds are
 * assumed paid out in cash), overShort = countedCash − expectedCash.
 * `current` also returns the live summary so the cashier sees the drawer
 * target before committing the close.
 */
@Injectable()
export class ShiftsService {
  constructor(private readonly shifts: ShiftsRepository) {}

  async open(dto: OpenShiftDto, actor: ShiftsActor): Promise<PosShift> {
    const branchId = this.requireBranch(actor);
    const existing = await this.shifts.findOpenForCashier(actor.id);
    if (existing) {
      throw new ConflictException(
        'You already have an open shift — close it before opening another',
      );
    }
    return this.shifts.insert({
      branchId,
      cashierId: actor.id,
      status: 'Open',
      openingFloat: round2(dto.openingFloat),
    });
  }

  async current(actor: ShiftsActor): Promise<CurrentShiftResponse> {
    const shift = await this.shifts.findOpenForCashier(actor.id);
    if (!shift) return { shift: null, live: null };
    const live = await this.computeWindow(shift, new Date());
    return { shift, live };
  }

  async close(dto: CloseShiftDto, actor: ShiftsActor): Promise<PosShift> {
    const shift = await this.shifts.findOpenForCashier(actor.id);
    if (!shift) {
      throw new NotFoundException('No open shift to close');
    }
    const closedAt = new Date();
    const live = await this.computeWindow(shift, closedAt);
    const countedCash = round2(dto.countedCash);
    const overShort = round2(countedCash - live.expectedCash);

    await this.shifts.update(shift.id, {
      status: 'Closed',
      closedAt,
      countedCash,
      expectedCash: live.expectedCash,
      overShort,
      totalCash: live.cash,
      totalCheque: live.cheque,
      totalBank: live.bank,
      totalCredit: live.credit,
      totalElectronic: live.electronic,
      salesCount: live.salesCount,
      salesTotal: live.salesTotal,
      refundsTotal: live.refundsTotal,
      notes: dto.notes ?? null,
    });

    const closed = await this.shifts.findById(shift.id);
    if (!closed) throw new NotFoundException('Shift vanished after close');
    return closed;
  }

  async list(
    query: ListShiftsQueryDto,
    actor: ShiftsActor,
  ): Promise<ShiftsListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const branchId =
      actor.role === UserRole.ADMIN
        ? query.branchId
        : (actor.branchId ?? undefined);
    const { rows, total } = await this.shifts.list({
      branchId,
      cashierId: query.cashierId,
      status: query.status,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  private async computeWindow(
    shift: PosShift,
    end: Date,
  ): Promise<ShiftLiveSummary> {
    const [tenders, sales, refundsTotal] = await Promise.all([
      this.shifts.tenderTotalsForWindow(
        shift.cashierId,
        shift.branchId,
        shift.openedAt,
        end,
      ),
      this.shifts.salesTotalsForWindow(
        shift.cashierId,
        shift.branchId,
        shift.openedAt,
        end,
      ),
      this.shifts.refundsForWindow(
        shift.cashierId,
        shift.branchId,
        shift.openedAt,
        end,
      ),
    ]);
    const expectedCash = round2(
      Number(shift.openingFloat) + tenders.cash - refundsTotal,
    );
    return {
      cash: tenders.cash,
      cheque: tenders.cheque,
      bank: tenders.bank,
      credit: tenders.credit,
      electronic: tenders.electronic,
      salesCount: sales.salesCount,
      salesTotal: sales.salesTotal,
      refundsTotal,
      expectedCash,
    };
  }

  private requireBranch(actor: ShiftsActor): string {
    if (!actor.branchId) {
      throw new ForbiddenException(
        'No branch linked to your account — shifts are branch-bound',
      );
    }
    return actor.branchId;
  }
}
