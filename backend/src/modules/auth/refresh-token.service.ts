import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { RefreshTokenRepository } from '@auth/refresh-token.repository';

export interface RefreshTokenMeta {
  userAgent?: string | null;
  ip?: string | null;
}

export interface RotatedRefreshToken {
  userId: string;
  token: string;
}

const DEFAULT_REFRESH_TTL = '30d';

/**
 * Opaque, rotating, hashed refresh tokens — revocable, unlike the stateless
 * RS256 access JWT. Rotation detects reuse of a spent token and revokes the
 * whole family (likely theft).
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly ttlMs: number;

  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    configService: ConfigService,
  ) {
    this.ttlMs = parseDurationMs(
      configService.get<string>('JWT_REFRESH_EXPIRES_IN', DEFAULT_REFRESH_TTL),
    );
  }

  /** Issue a brand-new refresh token (new family) and return the raw value. */
  async issue(userId: string, meta: RefreshTokenMeta = {}): Promise<string> {
    return this.mint(userId, randomUUID(), meta);
  }

  /**
   * Validate a presented refresh token, revoke it, and issue a replacement in
   * the same family. Throws on unknown/expired tokens and on reuse.
   */
  async rotate(
    rawToken: string,
    meta: RefreshTokenMeta = {},
  ): Promise<RotatedRefreshToken> {
    const existing = await this.refreshTokens.findByHash(hashToken(rawToken));
    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();

    if (existing.revokedAt) {
      // A spent token is being replayed — treat the family as compromised.
      this.logger.warn(
        `Refresh token reuse detected (family ${existing.family}); revoking family.`,
      );
      await this.refreshTokens.revokeFamily(existing.family, now);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.expiresAt.getTime() <= now.getTime()) {
      await this.refreshTokens.revokeById(existing.id, now);
      throw new UnauthorizedException('Refresh token expired');
    }

    const raw = randomBytes(32).toString('base64url');
    const hash = hashToken(raw);
    await this.refreshTokens.markRotated(existing.id, hash, now);
    await this.refreshTokens.create({
      userId: existing.userId,
      tokenHash: hash,
      family: existing.family,
      expiresAt: new Date(now.getTime() + this.ttlMs),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    });

    return { userId: existing.userId, token: raw };
  }

  /** Revoke a presented token's whole family (logout). Silent if unknown. */
  async revoke(rawToken: string): Promise<void> {
    const existing = await this.refreshTokens.findByHash(hashToken(rawToken));
    if (existing && !existing.revokedAt) {
      await this.refreshTokens.revokeFamily(existing.family, new Date());
    }
  }

  private async mint(
    userId: string,
    family: string,
    meta: RefreshTokenMeta,
  ): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    await this.refreshTokens.create({
      userId,
      tokenHash: hashToken(raw),
      family,
      expiresAt: new Date(Date.now() + this.ttlMs),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    });
    return raw;
  }
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (match) {
    const unitMs: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return Number(match[1]) * unitMs[match[2]];
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric * 1_000; // bare number = seconds (jsonwebtoken convention)
  }
  return 30 * 86_400_000;
}
