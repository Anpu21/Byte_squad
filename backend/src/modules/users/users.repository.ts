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
}
