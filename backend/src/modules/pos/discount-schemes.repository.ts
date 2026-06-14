import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, DeepPartial, Repository } from 'typeorm';
import { DiscountScheme } from '@pos/entities/discount-scheme.entity';

export interface ListSchemesOptions {
  branchId?: string;
  isActive?: boolean;
  limit: number;
  offset: number;
}

export interface PagedSchemes {
  rows: DiscountScheme[];
  total: number;
}

/** Discount-scheme repository (Rules.md §7). */
@Injectable()
export class DiscountSchemesRepository {
  private readonly schemes: Repository<DiscountScheme>;

  constructor(private readonly dataSource: DataSource) {
    this.schemes = dataSource.getRepository(DiscountScheme);
  }

  async findById(id: string): Promise<DiscountScheme | null> {
    return this.schemes.findOne({ where: { id } });
  }

  async create(partial: DeepPartial<DiscountScheme>): Promise<DiscountScheme> {
    return this.schemes.save(this.schemes.create(partial));
  }

  async save(scheme: DiscountScheme): Promise<DiscountScheme> {
    return this.schemes.save(scheme);
  }

  async remove(id: string): Promise<void> {
    await this.schemes.delete(id);
  }

  async list(opts: ListSchemesOptions): Promise<PagedSchemes> {
    const qb = this.schemes.createQueryBuilder('ds');
    if (opts.branchId) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('ds.branch_id = :branchId', {
            branchId: opts.branchId,
          }).orWhere('ds.branch_id IS NULL');
        }),
      );
    }
    if (opts.isActive !== undefined) {
      qb.andWhere('ds.is_active = :isActive', { isActive: opts.isActive });
    }
    const [rows, total] = await qb
      .orderBy('ds.created_at', 'DESC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }

  /** Rules live for a branch today: active, in-window, branch or global. */
  async findActiveForBranch(
    branchId: string,
    onDate: string,
  ): Promise<DiscountScheme[]> {
    return this.schemes
      .createQueryBuilder('ds')
      .where('ds.is_active = true')
      .andWhere('ds.start_date <= :onDate', { onDate })
      .andWhere('ds.end_date >= :onDate', { onDate })
      .andWhere(
        new Brackets((w) => {
          w.where('ds.branch_id = :branchId', { branchId }).orWhere(
            'ds.branch_id IS NULL',
          );
        }),
      )
      .orderBy('ds.discount_percentage', 'DESC')
      .getMany();
  }
}
