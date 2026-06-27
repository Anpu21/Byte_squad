/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { HeldSalesService } from './held-sales.service';
import { HeldSalesRepository } from './held-sales.repository';
import { HeldSale } from './entities/held-sale.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const CASHIER = { id: 'cashier-1', role: UserRole.CASHIER, branchId: BRANCH_A };
const ADMIN_NO_BRANCH = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };

function makeRow(overrides: Partial<HeldSale> = {}): HeldSale {
  return {
    id: 'held-1',
    branchId: BRANCH_A,
    cashierId: CASHIER.id,
    label: 'Anchor Milk',
    itemCount: 2,
    total: 1150,
    snapshot: { items: [] },
    cashier: { firstName: 'Nadia', lastName: 'Perera' },
    createdAt: new Date('2026-06-20T10:00:00Z'),
    updatedAt: new Date('2026-06-20T10:00:00Z'),
    ...overrides,
  } as unknown as HeldSale;
}

describe('HeldSalesService', () => {
  let service: HeldSalesService;
  let repo: jest.Mocked<HeldSalesRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HeldSalesService,
        {
          provide: HeldSalesRepository,
          useValue: {
            insert: jest.fn(),
            listForBranch: jest.fn(),
            findById: jest.fn(),
            deleteById: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(HeldSalesService);
    repo = moduleRef.get(HeldSalesRepository);
  });

  describe('hold', () => {
    it('persists the parked cart for the actor branch with a rounded total', async () => {
      repo.insert.mockResolvedValue(makeRow({ id: 'held-9' }));
      repo.findById.mockResolvedValue(makeRow({ id: 'held-9' }));

      const view = await service.hold(
        {
          label: 'Anchor Milk',
          itemCount: 2,
          total: 1150.005,
          snapshot: { items: [] },
        },
        CASHIER,
      );

      expect(repo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: BRANCH_A,
          cashierId: CASHIER.id,
          label: 'Anchor Milk',
          itemCount: 2,
          total: 1150.01,
        }),
      );
      expect(view.heldByName).toBe('Nadia Perera');
    });

    it('rejects an actor without a branch', async () => {
      await expect(
        service.hold(
          { label: 'x', itemCount: 1, total: 1, snapshot: {} },
          ADMIN_NO_BRANCH,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.insert).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('maps the branch shelf to views', async () => {
      repo.listForBranch.mockResolvedValue([makeRow()]);
      const rows = await service.list(CASHIER);
      expect(repo.listForBranch).toHaveBeenCalledWith(BRANCH_A);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.total).toBe(1150);
      expect(rows[0]?.heldByName).toBe('Nadia Perera');
    });

    it('returns empty for an admin with no branch', async () => {
      const rows = await service.list(ADMIN_NO_BRANCH);
      expect(rows).toEqual([]);
      expect(repo.listForBranch).not.toHaveBeenCalled();
    });
  });

  describe('discard', () => {
    it('deletes a same-branch held sale', async () => {
      repo.findById.mockResolvedValue(makeRow());
      await service.discard('held-1', CASHIER);
      expect(repo.deleteById).toHaveBeenCalledWith('held-1');
    });

    it('404s when the held sale is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.discard('nope', CASHIER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids discarding another branch’s held sale', async () => {
      repo.findById.mockResolvedValue(makeRow({ branchId: BRANCH_B }));
      await expect(service.discard('held-1', CASHIER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.deleteById).not.toHaveBeenCalled();
    });
  });
});
