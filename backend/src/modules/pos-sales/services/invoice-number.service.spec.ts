import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceCounter } from '@/modules/pos-sales/entities/invoice-counter.entity';

/**
 * Mocks an EntityManager whose getRepository(InvoiceCounter) returns a
 * controlled repo. The repo backs a single in-memory counter row per year so
 * the spec can simulate sequential and concurrent calls.
 */
interface CounterStore {
  rowsByYear: Map<number, InvoiceCounter>;
  findCalls: number;
  saveCalls: number;
  lockUsed: string | null;
}

function makeManager(store: CounterStore): EntityManager {
  type QB = {
    setLock: jest.Mock<QB, [string]>;
    where: jest.Mock<QB, [string, { year: number }]>;
    getOne: jest.Mock<Promise<InvoiceCounter | null>, []>;
  };

  let capturedYear: number | null = null;

  const counterRepo: Partial<Repository<InvoiceCounter>> = {
    createQueryBuilder: jest.fn((): QB => {
      const qb: QB = {
        setLock: jest.fn((mode: string) => {
          store.lockUsed = mode;
          return qb;
        }),
        where: jest.fn((_sql: string, params: { year: number }) => {
          capturedYear = params.year;
          return qb;
        }),
        getOne: jest.fn(() => {
          store.findCalls += 1;
          if (capturedYear == null) return Promise.resolve(null);
          return Promise.resolve(store.rowsByYear.get(capturedYear) ?? null);
        }),
      };
      return qb;
    }) as unknown as Repository<InvoiceCounter>['createQueryBuilder'],
    create: jest.fn(
      (data: Partial<InvoiceCounter>) => ({ ...data }) as InvoiceCounter,
    ) as unknown as Repository<InvoiceCounter>['create'],
    save: jest.fn((row: InvoiceCounter) => {
      store.saveCalls += 1;
      store.rowsByYear.set(row.year, { ...row });
      return Promise.resolve(row);
    }) as unknown as Repository<InvoiceCounter>['save'],
  };

  return {
    getRepository: jest.fn(() => counterRepo),
  } as unknown as EntityManager;
}

/**
 * Mocks a DataSource whose getRepository(InvoiceCounter) returns a read-only
 * repo backed by the same store used for the EntityManager mock. peek() uses
 * the data source directly because it runs outside any transaction.
 */
function makeDataSource(store: CounterStore): DataSource {
  const counterRepo: Partial<Repository<InvoiceCounter>> = {
    findOne: jest.fn(({ where }: { where: { year: number } }) => {
      return Promise.resolve(store.rowsByYear.get(where.year) ?? null);
    }) as unknown as Repository<InvoiceCounter>['findOne'],
  };

  return {
    getRepository: jest.fn(() => counterRepo),
  } as unknown as DataSource;
}

describe('InvoiceNumberService', () => {
  let svc: InvoiceNumberService;
  let store: CounterStore;
  let manager: EntityManager;
  let dataSource: DataSource;

  beforeEach(async () => {
    store = {
      rowsByYear: new Map(),
      findCalls: 0,
      saveCalls: 0,
      lockUsed: null,
    };
    manager = makeManager(store);
    dataSource = makeDataSource(store);

    const module = await Test.createTestingModule({
      providers: [
        InvoiceNumberService,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    svc = module.get(InvoiceNumberService);
  });

  describe('next', () => {
    it('issues INV-YYYY-000001 on the first call for a year', async () => {
      const issued = await svc.next(2026, manager);
      expect(issued).toBe('INV-2026-000001');
      expect(store.rowsByYear.get(2026)?.lastSeq).toBe(1);
    });

    it('issues sequential numbers across multiple calls in the same year', async () => {
      const a = await svc.next(2026, manager);
      const b = await svc.next(2026, manager);
      const c = await svc.next(2026, manager);
      expect(a).toBe('INV-2026-000001');
      expect(b).toBe('INV-2026-000002');
      expect(c).toBe('INV-2026-000003');
    });

    it('starts over at 000001 when the year rolls over', async () => {
      await svc.next(2026, manager);
      await svc.next(2026, manager);
      const next = await svc.next(2027, manager);
      expect(next).toBe('INV-2027-000001');
      expect(store.rowsByYear.get(2026)?.lastSeq).toBe(2);
      expect(store.rowsByYear.get(2027)?.lastSeq).toBe(1);
    });

    it('uses a pessimistic write lock when reading the counter row', async () => {
      await svc.next(2026, manager);
      expect(store.lockUsed).toBe('pessimistic_write');
    });

    it('pads the sequence to six digits', async () => {
      // Force the seed to a high value to verify formatting at width 6.
      store.rowsByYear.set(2026, {
        year: 2026,
        lastSeq: 99,
      } as InvoiceCounter);
      const next = await svc.next(2026, manager);
      expect(next).toBe('INV-2026-000100');
    });

    it('rejects a non-positive year argument', async () => {
      await expect(svc.next(0, manager)).rejects.toBeInstanceOf(Error);
      await expect(svc.next(-1, manager)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('peek', () => {
    it('returns INV-YYYY-000001 when no counter row exists for the year', async () => {
      const preview = await svc.peek(2026);
      expect(preview).toBe('INV-2026-000001');
    });

    it('returns INV-YYYY-(N+1) when a counter row is at N', async () => {
      store.rowsByYear.set(2026, {
        year: 2026,
        lastSeq: 42,
      } as InvoiceCounter);
      const preview = await svc.peek(2026);
      expect(preview).toBe('INV-2026-000043');
    });

    it('does NOT advance the counter', async () => {
      store.rowsByYear.set(2026, {
        year: 2026,
        lastSeq: 5,
      } as InvoiceCounter);
      await svc.peek(2026);
      await svc.peek(2026);
      await svc.peek(2026);
      expect(store.rowsByYear.get(2026)?.lastSeq).toBe(5);
    });

    it('pads the previewed sequence to six digits', async () => {
      store.rowsByYear.set(2026, {
        year: 2026,
        lastSeq: 99,
      } as InvoiceCounter);
      const preview = await svc.peek(2026);
      expect(preview).toBe('INV-2026-000100');
    });

    it('rejects a non-positive year argument', async () => {
      await expect(svc.peek(0)).rejects.toBeInstanceOf(Error);
      await expect(svc.peek(-1)).rejects.toBeInstanceOf(Error);
    });
  });
});
