import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import { InvoiceCounter } from '@pos/entities/invoice-counter.entity';

const SEQ_WIDTH = 6;

@Injectable()
export class InvoiceNumberService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Atomically issue the next invoice number for `year`.
   *
   * MUST be called inside a `DataSource.transaction(async manager => ...)`
   * block. The pessimistic write lock on the counter row only holds within
   * that surrounding transaction; passing in the active manager is what gives
   * us race-safety across concurrent checkouts.
   */
  async next(year: number, manager: EntityManager): Promise<string> {
    if (!Number.isInteger(year) || year <= 0) {
      throw new BadRequestException(
        `Invoice year must be a positive integer, got ${year}`,
      );
    }

    const repo = manager.getRepository(InvoiceCounter);

    const existing = await repo
      .createQueryBuilder('c')
      .setLock('pessimistic_write')
      .where('c.year = :year', { year })
      .getOne();

    const nextSeq = (existing?.lastSeq ?? 0) + 1;

    const row =
      existing ??
      repo.create({
        year,
        lastSeq: 0,
      });
    row.lastSeq = nextSeq;
    await repo.save(row);

    return formatInvoiceNumber(year, nextSeq);
  }

  /**
   * Returns the next invoice number WITHOUT advancing the counter. Pure read;
   * used by the cashier UI to preview the upcoming number while the sale is
   * being keyed in. The number returned here is NOT a reservation — concurrent
   * checkouts may issue the same value via `next()`, and the UI must reconcile
   * once the server returns the authoritative invoice number on commit.
   */
  async peek(year: number): Promise<string> {
    if (!Number.isInteger(year) || year <= 0) {
      throw new BadRequestException(
        `Invoice year must be a positive integer, got ${year}`,
      );
    }

    const counter = await this.dataSource
      .getRepository(InvoiceCounter)
      .findOne({ where: { year } });

    const nextSeq = (counter?.lastSeq ?? 0) + 1;
    return formatInvoiceNumber(year, nextSeq);
  }
}

function formatInvoiceNumber(year: number, seq: number): string {
  return `INV-${year}-${seq.toString().padStart(SEQ_WIDTH, '0')}`;
}
