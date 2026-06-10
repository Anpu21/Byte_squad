import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FiscalPeriodsService } from './fiscal-periods.service';

describe('FiscalPeriodsService', () => {
  let service: FiscalPeriodsService;
  let find: jest.Mock;
  let findOne: jest.Mock;
  let save: jest.Mock;
  let del: jest.Mock;

  beforeEach(async () => {
    find = jest.fn().mockResolvedValue([]);
    findOne = jest.fn().mockResolvedValue(null);
    save = jest.fn((p: unknown) => Promise.resolve(p));
    del = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FiscalPeriodsService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(() => ({
              find,
              findOne,
              save,
              delete: del,
              create: jest.fn((p: unknown) => p),
            })),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(FiscalPeriodsService);
  });

  it('allows postings into open months', async () => {
    find.mockResolvedValue([{ year: 2026, month: 5 }]);
    await expect(service.assertOpen('2026-06-10')).resolves.toBeUndefined();
  });

  it('rejects postings into a locked month with 409', async () => {
    find.mockResolvedValue([{ year: 2026, month: 5 }]);
    await expect(service.assertOpen('2026-05-31')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lock refuses double-locking and busts the cache', async () => {
    await service.assertOpen('2026-05-01'); // warm cache (empty)
    findOne.mockResolvedValue(null);
    await service.lock(2026, 5, 'admin-1');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026, month: 5 }),
    );

    // After locking, the cache is reloaded on next assert.
    find.mockResolvedValue([{ year: 2026, month: 5 }]);
    await expect(service.assertOpen('2026-05-15')).rejects.toBeInstanceOf(
      ConflictException,
    );

    findOne.mockResolvedValue({ year: 2026, month: 5 });
    await expect(service.lock(2026, 5, 'admin-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('unlock deletes and reopens the month', async () => {
    find.mockResolvedValue([{ year: 2026, month: 5 }]);
    await expect(service.assertOpen('2026-05-15')).rejects.toBeInstanceOf(
      ConflictException,
    );

    find.mockResolvedValue([]);
    await service.unlock(2026, 5);
    expect(del).toHaveBeenCalledWith({ year: 2026, month: 5 });
    await expect(service.assertOpen('2026-05-15')).resolves.toBeUndefined();
  });
});
