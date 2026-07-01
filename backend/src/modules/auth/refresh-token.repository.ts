import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '@auth/entities/refresh-token.entity';

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}

/**
 * The only layer that touches the refresh_tokens table. Queries by hash never
 * see (or store) the raw token.
 */
@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  create(data: NewRefreshToken): Promise<RefreshToken> {
    const entity = this.repo.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      family: data.family,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent ?? null,
      ip: data.ip ?? null,
      revokedAt: null,
      replacedByTokenHash: null,
    });
    return this.repo.save(entity);
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  async markRotated(
    id: string,
    replacedByTokenHash: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.repo.update(id, { replacedByTokenHash, revokedAt });
  }

  async revokeById(id: string, revokedAt: Date): Promise<void> {
    await this.repo.update(id, { revokedAt });
  }

  /** Revoke every still-active token in a rotation family (reuse / logout). */
  async revokeFamily(family: string, revokedAt: Date): Promise<void> {
    await this.repo.update({ family, revokedAt: IsNull() }, { revokedAt });
  }

  /** Housekeeping: drop rows past expiry. Returns the number removed. */
  async deleteExpired(now: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now })
      .execute();
    return result.affected ?? 0;
  }
}
