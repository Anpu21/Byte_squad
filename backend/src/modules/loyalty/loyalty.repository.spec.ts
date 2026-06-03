import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Repository, UpdateQueryBuilder } from 'typeorm';
import { LoyaltyRepository } from './loyalty.repository';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyCustomer } from './entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from './entities/loyalty-ledger-entry.entity';
import { Sale } from '@pos/entities/sale.entity';

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
  let dataSource: jest.Mocked<DataSource>;

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
          provide: getRepositoryToken(LoyaltyCustomer),
          useValue: {},
        },
        {
          provide: getRepositoryToken(LoyaltyLedgerEntry),
          useValue: ledgerRepoMock,
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
      ],
    }).compile();

    repo = module.get(LoyaltyRepository);
    accountRepo = module.get(getRepositoryToken(LoyaltyAccount));
    dataSource = module.get(DataSource);
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

  describe('applyEarnReversal', () => {
    it('caps balance and lifetime earned at zero', async () => {
      const { qb, calls } = makeFluentChainSpy({ affected: 1 });
      accountRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as ReturnType<
          Repository<LoyaltyAccount>['createQueryBuilder']
        >,
      );

      await repo.applyEarnReversal({ userId: 'user-1' }, 25);

      const setCall = calls.find((c) => c.name === 'set');
      const setArg = setCall?.args[0] as
        | {
            pointsBalance?: () => string;
            lifetimePointsEarned?: () => string;
          }
        | undefined;
      expect(setArg?.pointsBalance?.()).toMatch(/GREATEST/);
      expect(setArg?.lifetimePointsEarned?.()).toMatch(/GREATEST/);
      const whereCalls = calls.filter((c) => c.name === 'where');
      expect(whereCalls.length).toBe(1);
      expect(String(whereCalls[0].args[0])).toMatch(/user_id/);
    });
  });

  describe('mergeWalkInIntoUser', () => {
    it('reassigns historical walk-in sales before deleting the walk-in identity', async () => {
      const walkIn = {
        id: 'walkin-1',
        phone: '+94771234567',
      } as LoyaltyCustomer;
      const walkInAccount = {
        id: 'acc-walkin',
        pointsBalance: 20,
        lifetimePointsEarned: 40,
        lifetimePointsRedeemed: 5,
      } as LoyaltyAccount;
      const userAccount = {
        id: 'acc-user',
        userId: 'user-1',
        pointsBalance: 100,
        lifetimePointsEarned: 200,
        lifetimePointsRedeemed: 10,
      } as LoyaltyAccount;

      const saleQb = makeUpdateBuilder();
      const accountUpdateQb = makeUpdateBuilder();
      const accountsRepo = {
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(makeLockBuilder(walkInAccount))
          .mockReturnValueOnce(makeLockBuilder(userAccount))
          .mockReturnValueOnce(accountUpdateQb),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue(userAccount),
      };
      const customersRepo = {
        findOne: jest.fn().mockResolvedValue(walkIn),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      const ledgerRepo = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        create: jest.fn((partial: Partial<LoyaltyLedgerEntry>) => partial),
        save: jest.fn().mockResolvedValue({} as LoyaltyLedgerEntry),
      };
      const salesRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(saleQb),
      };
      const manager = {
        getRepository: jest.fn((target: unknown) => {
          if (target === LoyaltyAccount) return accountsRepo;
          if (target === LoyaltyCustomer) return customersRepo;
          if (target === LoyaltyLedgerEntry) return ledgerRepo;
          if (target === Sale) return salesRepo;
          throw new Error('Unexpected repository target');
        }),
      };
      const dataSourceMock = dataSource as unknown as {
        transaction: jest.Mock;
      };
      dataSourceMock.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<LoyaltyAccount>) =>
          cb(manager),
      );

      const result = await repo.mergeWalkInIntoUser({
        userId: 'user-1',
        loyaltyCustomerId: 'walkin-1',
      });

      expect(result).toBe(userAccount);
      expect(saleQb.set).toHaveBeenCalledWith({
        customerUserId: 'user-1',
        loyaltyCustomerId: null,
      });
      expect(saleQb.where).toHaveBeenCalledWith(
        'loyalty_customer_id = :loyaltyCustomerId',
        { loyaltyCustomerId: 'walkin-1' },
      );
      expect(saleQb.andWhere).toHaveBeenCalledWith('customer_user_id IS NULL');
      expect(saleQb.execute).toHaveBeenCalledTimes(1);
      expect(customersRepo.delete).toHaveBeenCalledWith('walkin-1');
    });
  });
});

function makeLockBuilder(result: LoyaltyAccount): {
  setLock: jest.Mock;
  where: jest.Mock;
  getOne: jest.Mock;
} {
  return {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

function makeUpdateBuilder(): {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  execute: jest.Mock;
} {
  return {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };
}
