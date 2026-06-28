import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { CreditAccountTransaction } from '@/modules/credit-accounts/entities/credit-account-transaction.entity';

/**
 * Append-only ledger repository for credit-account activity. Mirrors
 * {@link CreditTransactionRepository}: DataSource-injected with an optional
 * EntityManager passthrough so writes can join the checkout/repayment
 * transaction.
 */
@Injectable()
export class CreditAccountTransactionsRepository {
  private readonly repository: Repository<CreditAccountTransaction>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(CreditAccountTransaction);
  }

  async create(
    input: DeepPartial<CreditAccountTransaction>,
    manager?: EntityManager,
  ): Promise<CreditAccountTransaction> {
    const repo = manager
      ? manager.getRepository(CreditAccountTransaction)
      : this.repository;
    return repo.save(repo.create(input));
  }

  /** Statement order: most recent activity first. */
  async findByAccountId(
    creditAccountId: string,
  ): Promise<CreditAccountTransaction[]> {
    return this.repository
      .createQueryBuilder('t')
      .where('t.credit_account_id = :creditAccountId', { creditAccountId })
      .orderBy('t.created_at', 'DESC')
      .getMany();
  }

  /** Void-reversal order: oldest first, so reversals mirror the original writes. */
  async findBySaleId(saleId: string): Promise<CreditAccountTransaction[]> {
    return this.repository
      .createQueryBuilder('t')
      .where('t.sale_id = :saleId', { saleId })
      .orderBy('t.created_at', 'ASC')
      .getMany();
  }
}
