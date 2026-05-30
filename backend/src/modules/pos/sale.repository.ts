import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';

/**
 * Sale repository — Rules.md §7 (DataSource-injected, no
 * `@InjectRepository`). The Phase-2 surface is intentionally lean: a
 * persistence helper for the write path, a couple of lookups for the
 * read path, and a void mutation that flips status to 'Voided'. The
 * full Shanel-shaped query surface (recent-sales-with-customer joins,
 * filter-by-status, etc.) lands in Phase 4-5 alongside the new service.
 *
 * Existing PosRepository continues to back the legacy dashboard reads
 * until Phase 5 rewrites them.
 */
@Injectable()
export class SaleRepository {
  private readonly repository: Repository<Sale>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Sale);
  }

  async create(
    input: DeepPartial<Sale>,
    manager?: EntityManager,
  ): Promise<Sale> {
    const repo = manager ? manager.getRepository(Sale) : this.repository;
    return repo.save(repo.create(input));
  }

  async findOneById(id: string): Promise<Sale | null> {
    return this.repository.findOne({
      where: { id },
      // `items.unit` is eager-loaded so receipt previews / re-prints can
      // render the unit suffix (e.g. "250 g x LKR 0.20/g") that the FE
      // shipped in Phase P4. Without it the FE silently falls back to the
      // base-unit display.
      relations: [
        'items',
        'items.product',
        'items.unit',
        'cashier',
        'customer',
      ],
    });
  }

  async findOneByIdScopedToBranch(
    id: string,
    branchId: string,
  ): Promise<Sale | null> {
    return this.repository.findOne({
      where: { id, branchId },
      relations: [
        'items',
        'items.product',
        'items.unit',
        'cashier',
        'customer',
      ],
    });
  }

  /**
   * Bump the print-tracking columns on a sale row. The first print sets
   * `firstPrintDate` while every print updates `lastPrintDate` and
   * increments `billPrintCount`. The DB is the source of truth so the
   * caller passes the next count + dates to avoid an extra round-trip.
   *
   * Throws NotFoundException when no row matches — defensive against
   * silent updates that succeed-with-zero-rows in PostgreSQL.
   */
  async markPrinted(
    id: string,
    patch: {
      billPrinted: boolean;
      billPrintCount: number;
      firstPrintDate: Date | null;
      lastPrintDate: Date;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Sale) : this.repository;
    const result = await repo.update(id, patch);
    if (result.affected === 0) {
      throw new NotFoundException(`Sale ${id} not found`);
    }
  }

  async voidById(
    id: string,
    voidedByUserId: string,
    voidedReason: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Sale) : this.repository;
    const result = await repo.update(id, {
      status: 'Voided',
      voidedAt: new Date(),
      voidedByUserId,
      voidedReason,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Sale ${id} not found`);
    }
  }
}
