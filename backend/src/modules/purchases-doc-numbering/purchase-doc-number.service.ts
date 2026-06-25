import { BadRequestException, Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { PurchaseDocCounter } from '@/modules/purchases-doc-numbering/entities/purchase-doc-counter.entity';
import type { PurchaseDocType } from '@/modules/purchases-doc-numbering/types/purchase-doc-type.type';

const SEQ_WIDTH = 6;

/**
 * Atomic document numbering for the purchases module — `GRN-2026-000001`,
 * `PO-2026-000001`, … One year-scoped sequence per document family.
 *
 * `next()` MUST be called inside a `DataSource.transaction(manager => …)`
 * block: the pessimistic write lock on the counter row only holds within the
 * surrounding transaction (same contract as `InvoiceNumberService`).
 */
@Injectable()
export class PurchaseDocNumberService {
  async next(
    docType: PurchaseDocType,
    year: number,
    manager: EntityManager,
  ): Promise<string> {
    if (!Number.isInteger(year) || year <= 0) {
      throw new BadRequestException(
        `Document year must be a positive integer, got ${year}`,
      );
    }

    const repo = manager.getRepository(PurchaseDocCounter);

    const existing = await repo
      .createQueryBuilder('c')
      .setLock('pessimistic_write')
      .where('c.doc_type = :docType AND c.year = :year', { docType, year })
      .getOne();

    const nextSeq = (existing?.lastSeq ?? 0) + 1;

    const row = existing ?? repo.create({ docType, year, lastSeq: 0 });
    row.lastSeq = nextSeq;
    await repo.save(row);

    return `${docType}-${year}-${nextSeq.toString().padStart(SEQ_WIDTH, '0')}`;
  }
}
