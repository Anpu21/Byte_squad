import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';

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
}
