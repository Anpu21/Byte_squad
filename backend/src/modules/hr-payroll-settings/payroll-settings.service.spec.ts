/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { PayrollSettingsService } from './payroll-settings.service';
import { PayrollSettingsRepository } from './payroll-settings.repository';
import { PayrollSettings } from './entities/payroll-settings.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const ADMIN_ID = 'admin-1';
const MANAGER_ID = 'manager-1';

function makeSettings(
  overrides: Partial<PayrollSettings> = {},
): PayrollSettings {
  return {
    id: 'settings-global',
    branchId: null,
    epfEmployeePercent: 8,
    epfEmployerPercent: 12,
    etfEmployerPercent: 3,
    attendanceBonusThreshold: 26,
    lateGraceMinutes: 15,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PayrollSettings;
}

describe('PayrollSettingsService', () => {
  let service: PayrollSettingsService;
  let repo: jest.Mocked<PayrollSettingsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PayrollSettingsService,
        {
          provide: PayrollSettingsRepository,
          useValue: {
            findGlobal: jest.fn(),
            findByBranch: jest.fn(),
            findEffective: jest.fn(),
            save: jest.fn(),
            updatePartial: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(PayrollSettingsService);
    repo = moduleRef.get(PayrollSettingsRepository);
  });

  describe('getEffective', () => {
    it('prefers branch row when present', async () => {
      const branchRow = makeSettings({
        id: 'settings-branch-a',
        branchId: BRANCH_A,
        lateGraceMinutes: 5,
      });
      repo.findEffective.mockResolvedValue(branchRow);

      const out = await service.getEffective(BRANCH_A);
      expect(out).toBe(branchRow);
      expect(repo.findEffective).toHaveBeenCalledWith(BRANCH_A);
    });

    it('falls back to global when no branch row exists', async () => {
      // Service delegates to repo.findEffective, which itself handles
      // the branch-vs-global precedence. Behaviour is asserted via the
      // repo contract elsewhere; here we make sure the service is a
      // pass-through and forwards null when the caller has no branch.
      const globalRow = makeSettings();
      repo.findEffective.mockResolvedValue(globalRow);

      const out = await service.getEffective(null);
      expect(out).toBe(globalRow);
      expect(repo.findEffective).toHaveBeenCalledWith(null);
    });

    it('throws when neither branch nor global exists', async () => {
      repo.findEffective.mockRejectedValue(
        new InternalServerErrorException('missing'),
      );
      await expect(service.getEffective(null)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('updateGlobal', () => {
    it('happy path patches the global row', async () => {
      repo.findGlobal.mockResolvedValue(makeSettings());
      repo.updatePartial.mockResolvedValue(
        makeSettings({ lateGraceMinutes: 20 }),
      );

      const out = await service.updateGlobal(
        { lateGraceMinutes: 20 },
        { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
      );
      expect(out.lateGraceMinutes).toBe(20);
      expect(repo.updatePartial).toHaveBeenCalledWith(
        'settings-global',
        expect.objectContaining({ lateGraceMinutes: 20 }),
      );
    });

    it('forbids managers', async () => {
      await expect(
        service.updateGlobal(
          { lateGraceMinutes: 10 },
          { id: MANAGER_ID, role: UserRole.MANAGER, branchId: BRANCH_A },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updatePartial).not.toHaveBeenCalled();
    });

    it('throws when the global row is missing', async () => {
      repo.findGlobal.mockResolvedValue(null);
      await expect(
        service.updateGlobal(
          { lateGraceMinutes: 20 },
          { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
        ),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('upsertBranch', () => {
    const dtoForBranchA = {
      branchId: BRANCH_A,
      lateGraceMinutes: 10,
    };

    it('creates a new branch row when none exists', async () => {
      repo.findByBranch.mockResolvedValue(null);
      repo.save.mockImplementation((input) =>
        Promise.resolve(
          makeSettings({
            id: 'settings-branch-a',
            ...(input as Partial<PayrollSettings>),
          }),
        ),
      );

      const out = await service.upsertBranch(dtoForBranchA, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(out.branchId).toBe(BRANCH_A);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A, lateGraceMinutes: 10 }),
      );
      expect(repo.updatePartial).not.toHaveBeenCalled();
    });

    it('updates the existing branch row when present', async () => {
      repo.findByBranch.mockResolvedValue(
        makeSettings({ id: 'settings-branch-a', branchId: BRANCH_A }),
      );
      repo.updatePartial.mockResolvedValue(
        makeSettings({
          id: 'settings-branch-a',
          branchId: BRANCH_A,
          lateGraceMinutes: 10,
        }),
      );

      const out = await service.upsertBranch(dtoForBranchA, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(out.lateGraceMinutes).toBe(10);
      expect(repo.updatePartial).toHaveBeenCalledWith(
        'settings-branch-a',
        expect.objectContaining({ lateGraceMinutes: 10 }),
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('manager can upsert only their own branch', async () => {
      await expect(
        service.upsertBranch(
          { branchId: BRANCH_B, lateGraceMinutes: 10 },
          { id: MANAGER_ID, role: UserRole.MANAGER, branchId: BRANCH_A },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
      expect(repo.updatePartial).not.toHaveBeenCalled();
    });
  });

  describe('getGlobal', () => {
    it('returns the seeded row', async () => {
      const row = makeSettings();
      repo.findGlobal.mockResolvedValue(row);
      const out = await service.getGlobal();
      expect(out).toBe(row);
    });

    it('throws when the seed is missing', async () => {
      repo.findGlobal.mockResolvedValue(null);
      await expect(service.getGlobal()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
