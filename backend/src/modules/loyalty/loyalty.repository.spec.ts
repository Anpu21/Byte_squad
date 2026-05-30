import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository, UpdateQueryBuilder } from 'typeorm';
import { LoyaltyRepository } from './loyalty.repository';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from './entities/loyalty-ledger-entry.entity';

/**
 * Captures the full chain of method calls made against a fluent
 * builder so we can assert ordering. Each call appends `{ name, args }`
 * to `calls` and returns the same proxy so the chain keeps flowing.
 */
function makeFluentChainSpy(
  executeResult: { affected: number } = { affected: 1 },
): {
  qb: UpdateQueryBuilder<LoyaltyAccount>;
  calls: Array<{ name: string; args: unknown[] }>;
} {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol) {
      if (prop === 'execute') {
        return jest.fn().mockResolvedValue(executeResult);
      }
      return (...args: unknown[]) => {
        calls.push({ name: String(prop), args });
        return proxy;
      };
    },
  };
  const proxy = new Proxy({}, handler) as UpdateQueryBuilder<LoyaltyAccount>;
  return { qb: proxy, calls };
}

describe('LoyaltyRepository', () => {
  let repo: LoyaltyRepository;
  let accountRepo: jest.Mocked<Repository<LoyaltyAccount>>;

  beforeEach(async () => {
    const accountRepoMock: Partial<jest.Mocked<Repository<LoyaltyAccount>>> = {
      createQueryBuilder: jest.fn(),
    };
    const ledgerRepoMock: Partial<jest.Mocked<Repository<LoyaltyLedgerEntry>>> =
      {};

    const module = await Test.createTestingModule({
      providers: [
        LoyaltyRepository,
        {
          provide: getRepositoryToken(LoyaltyAccount),
          useValue: accountRepoMock,
        },
        {
          provide: getRepositoryToken(LoyaltyLedgerEntry),
          useValue: ledgerRepoMock,
        },
      ],
    }).compile();

    repo = module.get(LoyaltyRepository);
    accountRepo = module.get(getRepositoryToken(LoyaltyAccount));
  });

  describe('applyRedeem', () => {
    it('builds owner WHERE first and balance guard last so the guard survives', async () => {
      const { qb, calls } = makeFluentChainSpy({ affected: 1 });
      accountRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as ReturnType<
          Repository<LoyaltyAccount>['createQueryBuilder']
        >,
      );

      const ok = await repo.applyRedeem({ userId: 'user-1' }, 50);

      expect(ok).toBe(true);

      // The chain must contain a `.where(user_id...)` BEFORE a
      // `.andWhere(points_balance >= ...)`. If `.where()` ran after
      // `.andWhere()`, TypeORM's UpdateQueryBuilder would silently
      // reset the expression map and the guard would be dropped.
      const whereIdx = calls.findIndex(
        (c) => c.name === 'where' && /user_id/.test(String(c.args[0])),
      );
      const andWhereIdx = calls.findIndex(
        (c) =>
          c.name === 'andWhere' &&
          /points_balance\s*>=/.test(String(c.args[0])),
      );

      expect(whereIdx).toBeGreaterThanOrEqual(0);
      expect(andWhereIdx).toBeGreaterThanOrEqual(0);
      expect(whereIdx).toBeLessThan(andWhereIdx);

      // And the guard must be passed the same `points` value the
      // caller asked to redeem.
      expect(calls[andWhereIdx].args[1]).toEqual({ points: 50 });
    });

    it('routes walk-in owners through loyalty_customer_id', async () => {
      const { qb, calls } = makeFluentChainSpy({ affected: 1 });
      accountRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as ReturnType<
          Repository<LoyaltyAccount>['createQueryBuilder']
        >,
      );

      await repo.applyRedeem({ loyaltyCustomerId: 'walkin-9' }, 10);

      const whereCall = calls.find(
        (c) =>
          c.name === 'where' && /loyalty_customer_id/.test(String(c.args[0])),
      );
      expect(whereCall).toBeTruthy();
      expect(whereCall?.args[1]).toEqual({ loyaltyCustomerId: 'walkin-9' });

      const andWhereIdx = calls.findIndex(
        (c) =>
          c.name === 'andWhere' &&
          /points_balance\s*>=/.test(String(c.args[0])),
      );
      const whereIdx = calls.indexOf(whereCall!);
      expect(whereIdx).toBeLessThan(andWhereIdx);
    });

    it('returns false when the UPDATE affected zero rows (insufficient balance)', async () => {
      const { qb } = makeFluentChainSpy({ affected: 0 });
      accountRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as ReturnType<
          Repository<LoyaltyAccount>['createQueryBuilder']
        >,
      );

      const ok = await repo.applyRedeem({ userId: 'user-1' }, 999_999);
      expect(ok).toBe(false);
    });
  });

  describe('applyEarn', () => {
    it('sets only the owner WHERE — no balance guard to lose', async () => {
      const { qb, calls } = makeFluentChainSpy({ affected: 1 });
      accountRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as ReturnType<
          Repository<LoyaltyAccount>['createQueryBuilder']
        >,
      );

      await repo.applyEarn({ userId: 'user-1' }, 25);

      const whereCalls = calls.filter((c) => c.name === 'where');
      const andWhereCalls = calls.filter((c) => c.name === 'andWhere');
      expect(whereCalls.length).toBe(1);
      expect(andWhereCalls.length).toBe(0);
      expect(String(whereCalls[0].args[0])).toMatch(/user_id/);
    });
  });

  describe('applyRedeemReversal', () => {
    it('sets only the owner WHERE — no balance guard to lose', async () => {
      const { qb, calls } = makeFluentChainSpy({ affected: 1 });
      accountRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as ReturnType<
          Repository<LoyaltyAccount>['createQueryBuilder']
        >,
      );

      await repo.applyRedeemReversal({ loyaltyCustomerId: 'walkin-2' }, 5);

      const whereCalls = calls.filter((c) => c.name === 'where');
      const andWhereCalls = calls.filter((c) => c.name === 'andWhere');
      expect(whereCalls.length).toBe(1);
      expect(andWhereCalls.length).toBe(0);
      expect(String(whereCalls[0].args[0])).toMatch(/loyalty_customer_id/);
    });
  });
});
