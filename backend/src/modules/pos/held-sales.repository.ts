import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { HeldSale } from '@pos/entities/held-sale.entity';

/**
 * Data access for parked sales. Reads load the cashier relation so the
 * shelf can show who held each bill (supervisor-visible within a branch).
 */
@Injectable()
export class HeldSalesRepository {
  private readonly held: Repository<HeldSale>;

  constructor(private readonly dataSource: DataSource) {
    this.held = dataSource.getRepository(HeldSale);
  }

  async insert(partial: DeepPartial<HeldSale>): Promise<HeldSale> {
    return this.held.save(this.held.create(partial));
  }

  async listForBranch(branchId: string): Promise<HeldSale[]> {
    return this.held.find({
      where: { branchId },
      relations: { cashier: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<HeldSale | null> {
    return this.held.findOne({
      where: { id },
      relations: { cashier: true },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.held.delete(id);
  }
}
