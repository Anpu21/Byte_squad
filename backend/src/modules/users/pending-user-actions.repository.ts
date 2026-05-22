import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { PendingUserAction } from '@users/entities/pending-user-action.entity';

@Injectable()
export class PendingUserActionsRepository {
  constructor(
    @InjectRepository(PendingUserAction)
    private readonly repo: Repository<PendingUserAction>,
  ) {}

  async create(
    partial: DeepPartial<PendingUserAction>,
  ): Promise<PendingUserAction> {
    return this.repo.save(this.repo.create(partial));
  }

  async findById(id: string): Promise<PendingUserAction | null> {
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
