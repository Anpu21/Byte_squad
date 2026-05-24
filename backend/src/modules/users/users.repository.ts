import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { User } from '@users/entities/user.entity';
import { UserRole } from '@common/enums/user-roles.enums';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async createAndSave(partial: DeepPartial<User>): Promise<User> {
    return this.repo.save(this.repo.create(partial));
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdWithBranch(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: ['branch'] });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * Exact-match lookup against the (partial-unique) `users.phone`
   * column. Used by loyalty phone lookup at the POS so an existing
   * online customer always wins over a walk-in record.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async findAllScoped(branchId: string | null): Promise<User[]> {
    return this.repo.find({
      where: branchId === null ? {} : { branchId },
      relations: ['branch'],
    });
  }

  async update(id: string, partial: DeepPartial<User>): Promise<void> {
    await this.repo.update(id, partial);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAllByRole(role: UserRole): Promise<User[]> {
    return this.repo.find({ where: { role } });
  }

  async findFirstByBranchAndRole(
    branchId: string,
    role: UserRole,
  ): Promise<User | null> {
    return this.repo.findOne({
      where: { branchId, role },
      order: { createdAt: 'ASC' },
    });
  }

  async countByBranch(branchId: string): Promise<number> {
    return this.repo.count({ where: { branchId } });
  }

  async findAllByRoleWithBranch(role: UserRole): Promise<User[]> {
    return this.repo.find({
      where: { role },
      relations: ['branch'],
      order: { createdAt: 'ASC' },
    });
  }

  async findAllWithBranch(): Promise<User[]> {
    return this.repo.find({
      relations: ['branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findManagersAndAdminsForBranches(
    branchIds: readonly string[],
  ): Promise<User[]> {
    if (branchIds.length === 0) return [];
    return this.repo.find({
      where: {
        branchId: In([...branchIds]),
        role: In([UserRole.ADMIN, UserRole.MANAGER]),
      },
    });
  }

  async findByBranchAndRole(branchId: string, role: UserRole): Promise<User[]> {
    return this.repo.find({ where: { branchId, role } });
  }

  /**
   * Prefix-match customer rows for the POS customer picker. Searches across
   * first/last name, email, and phone with a single ILIKE pattern so the
   * cashier can type any leading fragment. Always scopes to CUSTOMER rows
   * so cashier/manager/admin accounts never leak into the picker.
   *
   * The repository returns full entities; the calling service is responsible
   * for projecting to the thin Shanel-shaped row.
   */
  async searchCustomersByText(term: string, limit: number): Promise<User[]> {
    const pattern = `${term}%`;
    return this.repo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.CUSTOMER })
      .andWhere(
        '(u.first_name ILIKE :pattern OR u.last_name ILIKE :pattern OR u.email ILIKE :pattern OR u.phone ILIKE :pattern)',
        { pattern },
      )
      .orderBy('u.first_name', 'ASC')
      .addOrderBy('u.last_name', 'ASC')
      .limit(limit)
      .getMany();
  }
}
