import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { JournalVoucher } from '@accounting/entities/journal-voucher.entity';
import { JournalCounter } from '@accounting/entities/journal-counter.entity';
import { Account } from '@accounting/entities/account.entity';
import { AccountingRepository } from '@accounting/accounting.repository';
import { CreateJournalVoucherDto } from '@accounting/dto/create-journal-voucher.dto';

export interface JournalActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

const SEQ_WIDTH = 6;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Manual journal vouchers — the accountant's pen. Lines must balance
 * (Σ debits = Σ credits); each line lands as a real `ledger_entries`
 * row with its chosen account, so the ledger and the financial reports
 * see journals exactly like system postings.
 */
@Injectable()
export class JournalVouchersService {
  constructor(
    private readonly accounting: AccountingRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateJournalVoucherDto,
    actor: JournalActor,
  ): Promise<JournalVoucher> {
    const branchId = this.resolveBranch(dto.branchId, actor);

    const debits = round2(
      dto.lines
        .filter((l) => l.entryType === LedgerEntryType.DEBIT)
        .reduce((sum, l) => sum + l.amount, 0),
    );
    const credits = round2(
      dto.lines
        .filter((l) => l.entryType === LedgerEntryType.CREDIT)
        .reduce((sum, l) => sum + l.amount, 0),
    );
    if (debits <= 0 || credits <= 0) {
      throw new BadRequestException(
        'A journal needs at least one debit and one credit line',
      );
    }
    if (debits !== credits) {
      throw new BadRequestException(
        `Journal is out of balance — debits ${debits.toFixed(2)} vs credits ${credits.toFixed(2)}`,
      );
    }

    // Validate every account up-front (clear 404 instead of an FK error).
    const accountIds = [...new Set(dto.lines.map((l) => l.accountId))];
    const accounts = await this.dataSource
      .getRepository(Account)
      .findBy({ id: In(accountIds) });
    if (accounts.length !== accountIds.length) {
      throw new NotFoundException('One or more accounts do not exist');
    }

    const voucherId = await this.dataSource.transaction(async (manager) => {
      const voucherNumber = await this.nextNumber(manager);
      const voucherRepo = manager.getRepository(JournalVoucher);
      const voucher = await voucherRepo.save(
        voucherRepo.create({
          voucherNumber,
          branchId,
          entryDate: dto.entryDate ?? toIsoDate(new Date()),
          memo: dto.memo.trim(),
          total: debits,
          createdByUserId: actor.id,
        }),
      );

      for (const line of dto.lines) {
        await this.accounting.createLedgerEntryWithManager(manager, {
          branchId,
          entryType: line.entryType,
          amount: round2(line.amount),
          description: line.description?.trim() || dto.memo.trim(),
          referenceNumber: voucherNumber,
          accountId: line.accountId,
          journalVoucherId: voucher.id,
        });
      }

      return voucher.id;
    });

    const saved = await this.dataSource
      .getRepository(JournalVoucher)
      .findOne({ where: { id: voucherId }, relations: ['branch'] });
    if (!saved) throw new NotFoundException('Journal vanished after save');
    return saved;
  }

  /** Mirrors InvoiceNumberService: counter row locked inside the txn. */
  private async nextNumber(manager: EntityManager): Promise<string> {
    const year = new Date().getFullYear();
    const repo = manager.getRepository(JournalCounter);
    const existing = await repo
      .createQueryBuilder('c')
      .setLock('pessimistic_write')
      .where('c.year = :year', { year })
      .getOne();
    const nextSeq = (existing?.lastSeq ?? 0) + 1;
    const row = existing ?? repo.create({ year, lastSeq: 0 });
    row.lastSeq = nextSeq;
    await repo.save(row);
    return `JV-${year}-${nextSeq.toString().padStart(SEQ_WIDTH, '0')}`;
  }

  private resolveBranch(
    requested: string | undefined,
    actor: JournalActor,
  ): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException(
          'branchId is required when posting journals as an admin',
        );
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot post journals to another branch');
    }
    return actor.branchId;
  }
}
