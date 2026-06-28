import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { Sale } from '@pos/entities/sale.entity';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';
import { round2 } from '@/modules/credit-accounts/lib/credit-account-math';
import type { CreditAccountAgeing } from '@/modules/credit-accounts/types';

interface AgeingRaw {
  accountId: string;
  notDue: string;
  d1to30: string;
  d31to60: string;
  d61to90: string;
  d90plus: string;
}

export interface ListCreditAccountsFilters {
  status?: CreditAccountStatus;
  branchId?: string | null;
  search?: string;
}

/**
 * CreditAccount repository (DataSource-injected per Rules.md §7). Owns account
 * CRUD reads/writes, the per-branch phone-uniqueness lookup, account-number
 * collision checks, the manager listing (with branch + requester relations),
 * and the POS picker search (ACTIVE accounts only).
 */
@Injectable()
export class CreditAccountsRepository {
  private readonly repository: Repository<CreditAccount>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(CreditAccount);
  }

  create(input: Partial<CreditAccount>): CreditAccount {
    return this.repository.create(input);
  }

  async save(entity: CreditAccount): Promise<CreditAccount> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<CreditAccount | null> {
    return this.repository.findOne({
      where: { id },
      relations: { branch: true, requestedBy: true, reviewedBy: true },
    });
  }

  async findByBranchAndPhone(
    branchId: string,
    phone: string,
  ): Promise<CreditAccount | null> {
    return this.repository.findOne({ where: { branchId, phone } });
  }

  async accountNoExists(accountNo: string): Promise<boolean> {
    return (await this.repository.count({ where: { accountNo } })) > 0;
  }

  async list(filters: ListCreditAccountsFilters): Promise<CreditAccount[]> {
    const qb = this.repository
      .createQueryBuilder('ca')
      .leftJoinAndSelect('ca.branch', 'branch')
      .leftJoinAndSelect('ca.requestedBy', 'requestedBy')
      .leftJoinAndSelect('ca.reviewedBy', 'reviewedBy')
      .orderBy('ca.created_at', 'DESC');
    if (filters.status) {
      qb.andWhere('ca.status = :status', { status: filters.status });
    }
    if (filters.branchId) {
      qb.andWhere('ca.branch_id = :branchId', { branchId: filters.branchId });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(ca.holder_name) LIKE :term OR LOWER(ca.phone) LIKE :term OR LOWER(ca.account_no) LIKE :term)',
        { term: `%${filters.search.toLowerCase()}%` },
      );
    }
    return qb.getMany();
  }

  /** POS picker: ACTIVE accounts at one branch matching name/phone/account no. */
  async search(params: {
    branchId: string;
    q: string;
    limit: number;
  }): Promise<CreditAccount[]> {
    return this.repository
      .createQueryBuilder('ca')
      .where('ca.branch_id = :branchId', { branchId: params.branchId })
      .andWhere('ca.status = :status', { status: CreditAccountStatus.ACTIVE })
      .andWhere(
        '(LOWER(ca.holder_name) LIKE :term OR LOWER(ca.phone) LIKE :term OR LOWER(ca.account_no) LIKE :term)',
        { term: `%${params.q.toLowerCase()}%` },
      )
      .orderBy('ca.holder_name', 'ASC')
      .limit(params.limit)
      .getMany();
  }

  /**
   * Outstanding credit per account, bucketed by days past `due_date`, summed
   * over Active sales with a positive balance. Keyed by accountId. Mirrors the
   * receivables ageing SQL but buckets on the customer-facing due date.
   */
  async ageingByAccounts(
    accountIds: string[],
  ): Promise<Map<string, CreditAccountAgeing>> {
    const map = new Map<string, CreditAccountAgeing>();
    if (accountIds.length === 0) return map;
    const rows = await this.dataSource
      .getRepository(Sale)
      .createQueryBuilder('s')
      .select('s.credit_account_id', 'accountId')
      .addSelect(
        'COALESCE(SUM(CASE WHEN s.due_date IS NULL OR s.due_date >= CURRENT_DATE THEN s.balance_due ELSE 0 END), 0)',
        'notDue',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN CURRENT_DATE - s.due_date BETWEEN 1 AND 30 THEN s.balance_due ELSE 0 END), 0)',
        'd1to30',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN CURRENT_DATE - s.due_date BETWEEN 31 AND 60 THEN s.balance_due ELSE 0 END), 0)',
        'd31to60',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN CURRENT_DATE - s.due_date BETWEEN 61 AND 90 THEN s.balance_due ELSE 0 END), 0)',
        'd61to90',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN CURRENT_DATE - s.due_date > 90 THEN s.balance_due ELSE 0 END), 0)',
        'd90plus',
      )
      .where('s.credit_account_id IN (:...accountIds)', { accountIds })
      .andWhere("s.status = 'Active'")
      .andWhere('s.balance_due > 0')
      .groupBy('s.credit_account_id')
      .getRawMany<AgeingRaw>();

    for (const r of rows) {
      const notDue = Number(r.notDue);
      const d1to30 = Number(r.d1to30);
      const d31to60 = Number(r.d31to60);
      const d61to90 = Number(r.d61to90);
      const d90plus = Number(r.d90plus);
      const overdueTotal = round2(d1to30 + d31to60 + d61to90 + d90plus);
      map.set(r.accountId, {
        notDue,
        d1to30,
        d31to60,
        d61to90,
        d90plus,
        overdueTotal,
        outstandingTotal: round2(notDue + overdueTotal),
      });
    }
    return map;
  }

  /** Unpaid credit sales for one account, oldest-due first (for FIFO + display). */
  async outstandingSales(accountId: string): Promise<Sale[]> {
    return this.dataSource
      .getRepository(Sale)
      .createQueryBuilder('s')
      .where('s.credit_account_id = :accountId', { accountId })
      .andWhere("s.status = 'Active'")
      .andWhere('s.balance_due > 0')
      .orderBy('s.due_date', 'ASC', 'NULLS LAST')
      .addOrderBy('s.created_at', 'ASC')
      .getMany();
  }
}
