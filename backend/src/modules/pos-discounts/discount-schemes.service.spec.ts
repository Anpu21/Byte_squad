/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { DiscountSchemesService } from './discount-schemes.service';
import { DiscountSchemesRepository } from './discount-schemes.repository';
import { DiscountScheme } from './entities/discount-scheme.entity';
import { CreateDiscountSchemeDto } from './dto/create-discount-scheme.dto';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const SCHEME_ID = '33333333-3333-3333-3333-333333333333';
const PRODUCT_ID = '44444444-4444-4444-4444-444444444444';
const CASHIER = { id: 'cashier-1', role: UserRole.CASHIER, branchId: BRANCH_A };
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };

function makeScheme(overrides: Partial<DiscountScheme> = {}): DiscountScheme {
  return {
    id: SCHEME_ID,
    name: 'June Rice Promo',
    branchId: BRANCH_A,
    scope: 'Product',
    productId: PRODUCT_ID,
    category: null,
    minQty: 5,
    discountPercentage: 10,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    isActive: true,
    createdByUserId: MANAGER.id,
    ...overrides,
  } as DiscountScheme;
}

function baseDto(
  overrides: Partial<CreateDiscountSchemeDto> = {},
): CreateDiscountSchemeDto {
  return {
    name: 'June Rice Promo',
    scope: 'Product',
    productId: PRODUCT_ID,
    discountPercentage: 10,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    ...overrides,
  } as CreateDiscountSchemeDto;
}

describe('DiscountSchemesService', () => {
  let service: DiscountSchemesService;
  let repo: jest.Mocked<DiscountSchemesRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DiscountSchemesService,
        {
          provide: DiscountSchemesRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            list: jest.fn(),
            findActiveForBranch: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(DiscountSchemesService);
    repo = moduleRef.get(DiscountSchemesRepository);
  });

  describe('list', () => {
    it('lets admins see every branch (no branch filter)', async () => {
      repo.list.mockResolvedValue({ rows: [], total: 0 });
      await service.list(ADMIN, true);
      expect(repo.list).toHaveBeenCalledWith({
        branchId: undefined,
        isActive: true,
        limit: 100,
        offset: 0,
      });
    });

    it('pins managers to their own branch', async () => {
      repo.list.mockResolvedValue({ rows: [], total: 0 });
      await service.list(MANAGER, undefined);
      expect(repo.list).toHaveBeenCalledWith({
        branchId: BRANCH_A,
        isActive: undefined,
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('activeForCashier', () => {
    it('returns nothing when the actor has no branch', async () => {
      await expect(
        service.activeForCashier({ ...CASHIER, branchId: null }),
      ).resolves.toEqual([]);
      expect(repo.findActiveForBranch).not.toHaveBeenCalled();
    });

    it('queries the cashier branch with an ISO date', async () => {
      repo.findActiveForBranch.mockResolvedValue([makeScheme()]);
      const rows = await service.activeForCashier(CASHIER);
      expect(rows).toHaveLength(1);
      expect(repo.findActiveForBranch).toHaveBeenCalledWith(
        BRANCH_A,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      );
    });
  });

  describe('create', () => {
    it('rejects a window where startDate is after endDate', async () => {
      await expect(
        service.create(
          baseDto({ startDate: '2026-07-01', endDate: '2026-06-01' }),
          MANAGER,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('pins a manager to their own branch', async () => {
      repo.create.mockImplementation((p) =>
        Promise.resolve(makeScheme(p as Partial<DiscountScheme>)),
      );
      await service.create(baseDto(), MANAGER);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: BRANCH_A,
          createdByUserId: MANAGER.id,
        }),
      );
    });

    it('blocks a manager creating for another branch', async () => {
      await expect(
        service.create(baseDto({ branchId: BRANCH_B }), MANAGER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets an admin create a global (all-branch) rule', async () => {
      repo.create.mockImplementation((p) =>
        Promise.resolve(makeScheme(p as Partial<DiscountScheme>)),
      );
      await service.create(baseDto(), ADMIN);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: null }),
      );
    });

    it('nulls the category when scope is Product', async () => {
      repo.create.mockImplementation((p) =>
        Promise.resolve(makeScheme(p as Partial<DiscountScheme>)),
      );
      await service.create(
        baseDto({ scope: 'Product', category: 'Grocery' }),
        MANAGER,
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ productId: PRODUCT_ID, category: null }),
      );
    });

    it('nulls the productId when scope is Category', async () => {
      repo.create.mockImplementation((p) =>
        Promise.resolve(makeScheme(p as Partial<DiscountScheme>)),
      );
      await service.create(
        baseDto({ scope: 'Category', category: 'Grocery' }),
        MANAGER,
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ productId: null, category: 'Grocery' }),
      );
    });
  });

  describe('update', () => {
    it('404s when the scheme does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update(SCHEME_ID, { name: 'x' }, ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks a manager editing another branch's scheme", async () => {
      repo.findById.mockResolvedValue(makeScheme({ branchId: BRANCH_B }));
      await expect(
        service.update(SCHEME_ID, { name: 'x' }, MANAGER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks a manager editing a global scheme', async () => {
      repo.findById.mockResolvedValue(makeScheme({ branchId: null }));
      await expect(
        service.update(SCHEME_ID, { isActive: false }, MANAGER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('validates the merged date window', async () => {
      repo.findById.mockResolvedValue(makeScheme({ endDate: '2026-06-30' }));
      await expect(
        service.update(SCHEME_ID, { startDate: '2026-07-15' }, MANAGER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('nulls the opposite target when the scope flips', async () => {
      repo.findById.mockResolvedValue(makeScheme());
      repo.save.mockImplementation((s) => Promise.resolve(s));
      const updated = await service.update(
        SCHEME_ID,
        { scope: 'Category', category: 'Grocery' },
        MANAGER,
      );
      expect(updated.productId).toBeNull();
      expect(updated.category).toBe('Grocery');
    });
  });

  describe('remove', () => {
    it('deletes an owned scheme', async () => {
      repo.findById.mockResolvedValue(makeScheme());
      await service.remove(SCHEME_ID, MANAGER);
      expect(repo.remove).toHaveBeenCalledWith(SCHEME_ID);
    });

    it("blocks deleting another branch's scheme", async () => {
      repo.findById.mockResolvedValue(makeScheme({ branchId: BRANCH_B }));
      await expect(service.remove(SCHEME_ID, MANAGER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
