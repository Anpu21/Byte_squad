import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { HeldSalesRepository } from '@pos/held-sales.repository';
import { HeldSale } from '@pos/entities/held-sale.entity';
import { HoldSaleDto } from '@pos/dto/hold-sale.dto';
import type { HeldSaleSnapshot } from '@pos/types/held-sale-snapshot.type';

export interface HeldSalesActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

/** Shelf-facing projection of a parked sale. */
export interface HeldSaleView {
  id: string;
  label: string;
  itemCount: number;
  total: number;
  snapshot: HeldSaleSnapshot;
  /** Cashier who parked it — supervisor-visible within the branch. */
  heldByName: string | null;
  createdAt: Date;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Server-persisted held / suspended sales. A parked cart lives only as an
 * opaque snapshot scoped to a branch, so any terminal in that branch can
 * recall it; it touches no stock or ledger until resumed and checked out.
 */
@Injectable()
export class HeldSalesService {
  constructor(private readonly held: HeldSalesRepository) {}

  async hold(dto: HoldSaleDto, actor: HeldSalesActor): Promise<HeldSaleView> {
    const branchId = this.requireBranch(actor);
    const saved = await this.held.insert({
      branchId,
      cashierId: actor.id,
      label: dto.label,
      itemCount: dto.itemCount,
      total: round2(dto.total),
      snapshot: dto.snapshot,
    });
    // Reload with the cashier relation so the response carries heldByName.
    const withCashier = await this.held.findById(saved.id);
    return this.toView(withCashier ?? saved);
  }

  async list(actor: HeldSalesActor): Promise<HeldSaleView[]> {
    // Admins are cross-branch and don't run a till — no branch, no shelf.
    if (!actor.branchId) return [];
    const rows = await this.held.listForBranch(actor.branchId);
    return rows.map((row) => this.toView(row));
  }

  async discard(id: string, actor: HeldSalesActor): Promise<void> {
    const row = await this.held.findById(id);
    if (!row) throw new NotFoundException('Held sale not found');
    if (actor.role !== UserRole.ADMIN && row.branchId !== actor.branchId) {
      throw new ForbiddenException('Held sale belongs to another branch');
    }
    await this.held.deleteById(id);
  }

  private toView(row: HeldSale): HeldSaleView {
    const name = row.cashier
      ? `${row.cashier.firstName} ${row.cashier.lastName}`.trim()
      : null;
    return {
      id: row.id,
      label: row.label,
      itemCount: row.itemCount,
      total: Number(row.total),
      snapshot: row.snapshot,
      heldByName: name || null,
      createdAt: row.createdAt,
    };
  }

  private requireBranch(actor: HeldSalesActor): string {
    if (!actor.branchId) {
      throw new ForbiddenException(
        'No branch linked to your account — held sales are branch-bound',
      );
    }
    return actor.branchId;
  }
}
