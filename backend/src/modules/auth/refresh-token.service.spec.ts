/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { RefreshToken } from './entities/refresh-token.entity';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let repo: jest.Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue({} as RefreshToken),
      findByHash: jest.fn(),
      markRotated: jest.fn(),
      revokeById: jest.fn(),
      revokeFamily: jest.fn(),
      deleteExpired: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;
    const config = {
      get: jest.fn().mockReturnValue('30d'),
    } as unknown as ConfigService;
    service = new RefreshTokenService(repo, config);
  });

  it('issue() persists the hash (never the raw token) and returns the raw value', async () => {
    const raw = await service.issue('user-1');

    expect(typeof raw).toBe('string');
    expect(raw.length).toBeGreaterThan(20);
    expect(repo.create).toHaveBeenCalledTimes(1);
    const arg = repo.create.mock.calls[0][0];
    expect(arg.userId).toBe('user-1');
    expect(arg.tokenHash).not.toBe(raw);
    expect(arg.tokenHash).toHaveLength(64); // sha-256 hex
    expect(arg.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rotate() revokes the presented token and re-issues in the same family', async () => {
    repo.findByHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      family: 'fam-1',
      tokenHash: 'h',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as RefreshToken);

    const result = await service.rotate('raw-old');

    expect(result.userId).toBe('user-1');
    expect(typeof result.token).toBe('string');
    expect(repo.markRotated).toHaveBeenCalledWith(
      'rt-1',
      expect.any(String),
      expect.any(Date),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ family: 'fam-1', userId: 'user-1' }),
    );
  });

  it('rotate() detects reuse of a spent token and revokes the whole family', async () => {
    repo.findByHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      family: 'fam-1',
      tokenHash: 'h',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as RefreshToken);

    await expect(service.rotate('raw-stolen')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repo.revokeFamily).toHaveBeenCalledWith('fam-1', expect.any(Date));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rotate() rejects an unknown token', async () => {
    repo.findByHash.mockResolvedValue(null);
    await expect(service.rotate('nope')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotate() rejects and revokes an expired token', async () => {
    repo.findByHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      family: 'fam-1',
      tokenHash: 'h',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    } as RefreshToken);

    await expect(service.rotate('expired')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repo.revokeById).toHaveBeenCalledWith('rt-1', expect.any(Date));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('revoke() revokes the family for a known active token', async () => {
    repo.findByHash.mockResolvedValue({
      id: 'rt-1',
      family: 'fam-1',
      revokedAt: null,
    } as RefreshToken);

    await service.revoke('raw');

    expect(repo.revokeFamily).toHaveBeenCalledWith('fam-1', expect.any(Date));
  });
});
