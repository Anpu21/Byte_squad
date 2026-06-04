import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';

/**
 * Repository for the walk-in loyalty identity table. Walk-ins are
 * phone-only records (no email/password) created at the POS counter
 * when a cashier looks up a phone that doesn't already belong to a
 * registered user. See `LoyaltyCustomer` for the entity rationale.
 */
@Injectable()
export class LoyaltyCustomersRepository {
  constructor(
    @InjectRepository(LoyaltyCustomer)
    private readonly repo: Repository<LoyaltyCustomer>,
  ) {}

  findByPhone(phone: string): Promise<LoyaltyCustomer | null> {
    return this.repo.findOne({ where: { phone } });
  }

  findById(id: string): Promise<LoyaltyCustomer | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(input: {
    phone: string;
    firstName: string;
    lastName: string | null;
  }): Promise<LoyaltyCustomer> {
    return this.repo.save(this.repo.create(input));
  }
}
