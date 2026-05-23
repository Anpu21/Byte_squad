import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { CreditTransaction } from '@pos/entities/credit-transaction.entity';

/**
 * CreditTransaction repository — append-only audit log of customer credit
 * activity. Follows the Repository Pattern (Rules.md §7) with
 * DataSource-injected access and optional EntityManager passthrough.
 *
 * `findByUserId` orders by created_at DESC so the most recent activity
 * surfaces first for the cashier UI.
 */
@Injectable()
export class CreditTransactionRepository {
  private readonly repository: Repository<CreditTransaction>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(CreditTransaction);
  }

  async create(
    input: DeepPartial<CreditTransaction>,
    manager?: EntityManager,
  ): Promise<CreditTransaction> {
    const repo = manager
      ? manager.getRepository(CreditTransaction)
      : this.repository;
    return repo.save(repo.create(input));
  }

  async findByUserId(userId: string): Promise<CreditTransaction[]> {
    return this.repository
      .createQueryBuilder('ct')
      .where('ct.user_id = :userId', { userId })
      .orderBy('ct.created_at', 'DESC')
      .getMany();
  }
}
