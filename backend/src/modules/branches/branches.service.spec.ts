import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesRepository } from './branches.repository';
import { Branch } from './entities/branch.entity';
import { BranchPerformanceRepository } from './branch-performance.repository';

interface BranchesRepoMock {
  createAndSave: jest.Mock;
  findAll: jest.Mock;
  findById: jest.Mock;
  findByCode: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
}

const ADMIN_USER_ID = 'admin-1';

function buildBranch(overrides: Partial<Branch> = {}): Branch {
  // Use Object.assign with explicit return-type annotation so ESLint's
  // projectService resolver narrows the value to Branch instead of
  // treating field assignments on `new Branch()` as `any`. This matters
  // under CI's stricter type inference where the imperative
  // `entity.field = ...` pattern trips `no-unsafe-member-access`.
  const branch: Branch = Object.assign(new Branch(), {
    id: overrides.id ?? 'b1',
    code: overrides.code ?? 'BR001',
    name: overrides.name ?? 'Main',
    addressLine1: overrides.addressLine1 ?? '1 Main St',
    addressLine2: overrides.addressLine2 ?? null,
    city: overrides.city ?? null,
    state: overrides.state ?? null,
    country: overrides.country ?? null,
    postalCode: overrides.postalCode ?? null,
    phone: overrides.phone ?? '+10000000000',
    email: overrides.email ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  });
  return branch;
}

describe('BranchesService — direct admin mutations', () => {
  let service: BranchesService;
  let branchesRepo: BranchesRepoMock;

  beforeEach(async () => {
    branchesRepo = {
      createAndSave: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: BranchesRepository, useValue: branchesRepo },
        { provide: BranchPerformanceRepository, useValue: {} },
      ],
    }).compile();

    service = module.get(BranchesService);
  });

  describe('create', () => {
    it('rejects an empty branch code', async () => {
      await expect(
        service.create(ADMIN_USER_ID, {
          code: '   ',
          name: 'New',
          addressLine1: '1 Main',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(branchesRepo.createAndSave).not.toHaveBeenCalled();
    });

    it('rejects a duplicate branch code', async () => {
      branchesRepo.findByCode.mockResolvedValue(buildBranch({ id: 'other' }));

      await expect(
        service.create(ADMIN_USER_ID, {
          code: 'BR099',
          name: 'New',
          addressLine1: '1 Main',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(branchesRepo.createAndSave).not.toHaveBeenCalled();
    });

    it('persists and returns the new branch', async () => {
      branchesRepo.findByCode.mockResolvedValue(null);
      branchesRepo.createAndSave.mockResolvedValue(
        buildBranch({ id: 'b9', code: 'BR099', name: 'New' }),
      );

      const result = await service.create(ADMIN_USER_ID, {
        code: 'BR099',
        name: 'New',
        addressLine1: '1 Main',
      });

      expect(result.code).toBe('BR099');
      expect(branchesRepo.createAndSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('throws NotFound when branch missing', async () => {
      branchesRepo.findById.mockResolvedValue(null);
      await expect(
        service.update(ADMIN_USER_ID, 'missing', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a code that collides with another branch', async () => {
      branchesRepo.findById.mockResolvedValue(
        buildBranch({ id: 'b1', code: 'BR001' }),
      );
      branchesRepo.findByCode.mockResolvedValue(
        buildBranch({ id: 'b-other', code: 'BR099' }),
      );

      await expect(
        service.update(ADMIN_USER_ID, 'b1', { code: 'BR099' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(branchesRepo.update).not.toHaveBeenCalled();
    });

    it('allows keeping the same code unchanged', async () => {
      branchesRepo.findById
        .mockResolvedValueOnce(buildBranch({ id: 'b1', code: 'BR001' }))
        .mockResolvedValueOnce(
          buildBranch({ id: 'b1', code: 'BR001', name: 'Renamed' }),
        );

      const result = await service.update(ADMIN_USER_ID, 'b1', {
        code: 'BR001',
        name: 'Renamed',
      });

      expect(branchesRepo.findByCode).not.toHaveBeenCalled();
      expect(branchesRepo.update).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({ name: 'Renamed' }),
      );
      expect(result?.name).toBe('Renamed');
    });
  });

  describe('delete', () => {
    it('throws NotFound when branch missing', async () => {
      branchesRepo.findById.mockResolvedValue(null);
      await expect(
        service.delete(ADMIN_USER_ID, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes the branch via the repo', async () => {
      branchesRepo.findById.mockResolvedValue(buildBranch({ id: 'b1' }));
      await service.delete(ADMIN_USER_ID, 'b1');
      expect(branchesRepo.delete).toHaveBeenCalledWith('b1');
    });
  });

  describe('toggleActive', () => {
    it('flips isActive and persists via the repo', async () => {
      const branch = buildBranch({ id: 'b1', isActive: true });
      branchesRepo.findById.mockResolvedValue(branch);
      branchesRepo.save.mockImplementation((b: Branch) => Promise.resolve(b));
      const result = await service.toggleActive('b1');
      expect(result.isActive).toBe(false);
      expect(branchesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'b1', isActive: false }),
      );
    });

    it('refuses to toggle a missing branch', async () => {
      branchesRepo.findById.mockResolvedValue(null);
      await expect(service.toggleActive('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
