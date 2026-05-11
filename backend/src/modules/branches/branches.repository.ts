import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';

// Owns persistence for the Branch aggregate. Reporting in
// BranchesService still composes cross-module entity reads via
// @InjectRepository — those move to their respective module repos in
// later migration phases.
@Injectable()
export class BranchesRepository {
  constructor(
    @InjectRepository(Branch)
    private readonly repo: Repository<Branch>,
  ) {}

  async createAndSave(partial: DeepPartial<Branch>): Promise<Branch> {
    const entity = this.repo.create(partial);
    return this.repo.save(entity);
  }

  async findAll(): Promise<Branch[]> {
    return this.repo.find();
  }

  async findAllSortedByName(): Promise<Branch[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findByIds(ids: readonly string[]): Promise<Branch[]> {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In([...ids]) } });
  }

  async findById(id: string): Promise<Branch | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: DeepPartial<Branch>): Promise<void> {
    await this.repo.update(id, dto);
  }

  async save(branch: Branch): Promise<Branch> {
    return this.repo.save(branch);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
