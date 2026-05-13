import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { PendingBranchAction } from '@branches/entities/pending-branch-action.entity';

@Injectable()
export class PendingBranchActionsRepository {
  constructor(
    @InjectRepository(PendingBranchAction)
    private readonly repo: Repository<PendingBranchAction>,
  ) {}

  async create(
    partial: DeepPartial<PendingBranchAction>,
  ): Promise<PendingBranchAction> {
    return this.repo.save(this.repo.create(partial));
  }

  async findById(id: string): Promise<PendingBranchAction | null> {
    return this.repo.findOne({ where: { id } });
  }

  async markConsumed(id: string, at: Date): Promise<void> {
    await this.repo.update(id, { consumedAt: at });
  }

  async refreshOtp(
    id: string,
    otpCode: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repo.update(id, { otpCode, expiresAt });
  }
}
