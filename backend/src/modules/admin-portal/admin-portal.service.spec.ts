/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminPortalService } from './admin-portal.service';
import { AdminPortalReportsRepository } from './admin-portal-reports.repository';
import { BranchesService } from '@branches/branches.service';
import { UsersService } from '@users/users.service';
import { InventoryService } from '@/modules/inventory-core/inventory.service';
import { UserRole } from '@common/enums/user-roles.enums';
import type { BranchActor } from '@common/scope/branch-scope';

const ADMIN: BranchActor = { role: UserRole.ADMIN, branchId: null };
const MANAGER_B1: BranchActor = { role: UserRole.MANAGER, branchId: 'b1' };
const RANGE = [new Date('2026-01-01'), new Date('2026-02-01')] as const;

describe('AdminPortalService.getBranchComparison', () => {
  let service: AdminPortalService;
  let branches: jest.Mocked<BranchesService>;

  beforeEach(async () => {
    const branchesMock: Partial<jest.Mocked<BranchesService>> = {
      findByIds: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AdminPortalService,
        { provide: BranchesService, useValue: branchesMock },
        {
          provide: UsersService,
          useValue: {
            countByBranch: jest.fn(),
            findFirstByBranchAndRole: jest.fn(),
            findAllByRoleWithBranch: jest.fn(),
            findAllWithBranch: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            findByProductIds: jest.fn(),
            countActiveForBranch: jest.fn(),
            countLowStockForBranch: jest.fn(),
          },
        },
        { provide: AdminPortalReportsRepository, useValue: {} },
      ],
    }).compile();

    service = module.get(AdminPortalService);
    branches = module.get(BranchesService);
  });

  it('rejects empty branchIds before any DB call', async () => {
    await expect(
      service.getBranchComparison(ADMIN, [], ...RANGE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(branches.findByIds).not.toHaveBeenCalled();
  });

  it('rejects when startDate is after endDate', async () => {
    await expect(
      service.getBranchComparison(
        ADMIN,
        ['b1'],
        new Date('2026-02-01'),
        new Date('2026-01-01'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when no matching branches are found', async () => {
    branches.findByIds.mockResolvedValue([]);
    await expect(
      service.getBranchComparison(ADMIN, ['ghost'], ...RANGE),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids a manager comparing a branch outside their own (no DB call)', async () => {
    await expect(
      service.getBranchComparison(MANAGER_B1, ['b2'], ...RANGE),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(branches.findByIds).not.toHaveBeenCalled();
  });

  it('lets a manager through for their own branch (scope check passes)', async () => {
    branches.findByIds.mockResolvedValue([]);
    // Scope passes, so it proceeds past the guard and hits the empty-result path.
    await expect(
      service.getBranchComparison(MANAGER_B1, ['b1'], ...RANGE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(branches.findByIds).toHaveBeenCalledWith(['b1']);
  });
});
