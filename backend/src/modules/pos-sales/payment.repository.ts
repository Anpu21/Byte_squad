import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { Payment } from '@/modules/pos-sales/entities/payment.entity';

/**
 * Payment repository.
 *
 * Follows the Repository Pattern from Rules.md §7: DataSource-injected,
 * no `@InjectRepository`. Methods that participate in a wrapper transaction
 * accept an optional `manager?: EntityManager` parameter so the caller can
 * pass `dataSource.transaction(...)` context through.
 */
@Injectable()
export class PaymentRepository {
  private readonly repository: Repository<Payment>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Payment);
  }

  async create(
    input: DeepPartial<Payment>,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repo = manager ? manager.getRepository(Payment) : this.repository;
    return repo.save(repo.create(input));
  }

  async findOneById(id: string): Promise<Payment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySaleId(saleId: string): Promise<Payment | null> {
    return this.repository.findOne({ where: { saleId } });
  }

  async voidById(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Payment) : this.repository;
    const result = await repo.update(id, { status: 'Voided' });
    if (result.affected === 0) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
  }

  /**
   * Flip every Active payment row attached to a sale to 'Voided'. Used by
   * the void-sale flow so a reversed sale has no live payment rows
   * (otherwise the recent-sales view would still show it as paid).
   *
   * Doesn't throw if no rows are affected — a sale may legitimately
   * have its Payment row already voided by an earlier admin action; the
   * outer voidSale flow handles the not-found case at the Sale level.
   */
  async voidBySaleId(saleId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Payment) : this.repository;
    await repo.update({ saleId }, { status: 'Voided' });
  }
}
