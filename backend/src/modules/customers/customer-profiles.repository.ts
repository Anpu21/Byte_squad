import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CustomerProfile } from '@/modules/customers/entities/customer-profile.entity';

/**
 * CRUD for the `customer_profiles` side-table (management metadata only). The
 * cross-source aggregation reads live in the separate CustomersRepository; this
 * one stays focused on the profile row and its get-or-create semantics.
 */
@Injectable()
export class CustomerProfilesRepository {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly repo: Repository<CustomerProfile>,
  ) {}

  findByKey(customerKey: string): Promise<CustomerProfile | null> {
    return this.repo.findOne({ where: { customerKey } });
  }

  async findByKeys(
    customerKeys: string[],
  ): Promise<Map<string, CustomerProfile>> {
    if (customerKeys.length === 0) return new Map();
    const rows = await this.repo.find({
      where: { customerKey: In(customerKeys) },
    });
    return new Map(rows.map((row) => [row.customerKey, row]));
  }

  /** Get-or-create the profile row for a key (the metadata home for that customer). */
  async ensure(
    customerKey: string,
    createdByUserId: string | null,
  ): Promise<CustomerProfile> {
    const existing = await this.findByKey(customerKey);
    if (existing) return existing;
    const created = this.repo.create({
      customerKey,
      createdByUserId,
      tags: [],
    });
    return this.repo.save(created);
  }

  save(profile: CustomerProfile): Promise<CustomerProfile> {
    return this.repo.save(profile);
  }
}
