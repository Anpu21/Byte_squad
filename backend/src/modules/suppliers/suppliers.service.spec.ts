/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersRepository } from './suppliers.repository';
import { Supplier } from './entities/supplier.entity';

const ACTOR = { id: 'admin-1' };
const SUPPLIER_ID = '11111111-1111-1111-1111-111111111111';

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: SUPPLIER_ID,
    name: 'Lanka Dairies',
    contactName: null,
    phone: null,
    email: null,
    address: null,
    creditTermDays: 30,
    openingBalance: 0,
    status: 'Active',
    userId: null,
    notes: null,
    createdByUserId: ACTOR.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Supplier;
}

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repo: jest.Mocked<SuppliersRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: SuppliersRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            list: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(SuppliersService);
    repo = moduleRef.get(SuppliersRepository);
  });

  describe('create', () => {
    it('creates with trimmed name and defaults', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.create.mockImplementation((input) =>
        Promise.resolve(makeSupplier(input as Partial<Supplier>)),
      );
      await service.create({ name: '  Lanka Dairies  ' }, ACTOR);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Lanka Dairies',
          creditTermDays: 30,
          openingBalance: 0,
          createdByUserId: ACTOR.id,
        }),
      );
    });

    it('rejects a duplicate name (case-insensitive) with 409', async () => {
      repo.findByName.mockResolvedValue(makeSupplier());
      await expect(
        service.create({ name: 'lanka dairies' }, ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('404s for a missing supplier', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update(SUPPLIER_ID, { phone: '0771234567' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('guards duplicate names only when the name actually changes', async () => {
      repo.findById.mockResolvedValue(makeSupplier());
      repo.save.mockImplementation((s) => Promise.resolve(s));
      await service.update(SUPPLIER_ID, { name: 'LANKA DAIRIES' });
      expect(repo.findByName).not.toHaveBeenCalled();
    });

    it('rejects renaming onto an existing supplier', async () => {
      repo.findById.mockResolvedValue(makeSupplier());
      repo.findByName.mockResolvedValue(makeSupplier({ id: 'other' }));
      await expect(
        service.update(SUPPLIER_ID, { name: 'Ceylon Foods' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('deactivates instead of deleting', async () => {
      repo.findById.mockResolvedValue(makeSupplier());
      repo.save.mockImplementation((s) => Promise.resolve(s));
      const updated = await service.update(SUPPLIER_ID, {
        status: 'Inactive',
      });
      expect(updated.status).toBe('Inactive');
    });
  });

  describe('list', () => {
    it('clamps limit to 100 and floors offset at 0', async () => {
      repo.list.mockResolvedValue({ rows: [], total: 0 });
      await service.list({ limit: 999, offset: -5 });
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100, offset: 0 }),
      );
    });
  });
});
