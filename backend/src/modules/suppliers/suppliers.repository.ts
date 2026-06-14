import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import type { SupplierStatus } from '@/modules/suppliers/types/supplier-status.type';

export interface ListSuppliersOptions {
  search?: string;
  status?: SupplierStatus;
  limit: number;
  offset: number;
}

export interface PagedSuppliers {
  rows: Supplier[];
  total: number;
}

/**
 * Supplier repository (Rules.md §7): DataSource-injected, all data access for
 * the supplier master goes through here.
 */
@Injectable()
export class SuppliersRepository {
  private readonly repository: Repository<Supplier>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Supplier);
  }

  async create(input: DeepPartial<Supplier>): Promise<Supplier> {
    return this.repository.save(this.repository.create(input));
  }

  async save(supplier: Supplier): Promise<Supplier> {
    return this.repository.save(supplier);
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.repository.findOne({ where: { id } });
  }

  /** Case-insensitive exact-name lookup — used for duplicate guarding. */
  async findByName(name: string): Promise<Supplier | null> {
    return this.repository
      .createQueryBuilder('s')
      .where('LOWER(s.name) = LOWER(:name)', { name })
      .getOne();
  }

  async list(opts: ListSuppliersOptions): Promise<PagedSuppliers> {
    const qb = this.repository.createQueryBuilder('s');
    if (opts.status) {
      qb.andWhere('s.status = :status', { status: opts.status });
    }
    if (opts.search) {
      qb.andWhere(
        '(s.name ILIKE :search OR s.contact_name ILIKE :search OR s.phone ILIKE :search)',
        { search: `%${opts.search}%` },
      );
    }
    const [rows, total] = await qb
      .orderBy('s.name', 'ASC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }
}
