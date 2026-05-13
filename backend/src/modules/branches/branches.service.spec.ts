import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesRepository } from './branches.repository';
import { PendingBranchActionsRepository } from './pending-branch-actions.repository';
import { Branch } from './entities/branch.entity';
import {
  PendingBranchAction,
  PendingBranchActionPayload,
  PendingBranchActionType,
} from './entities/pending-branch-action.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { UsersService } from '@users/users.service';
import { EmailService } from '@/modules/email/email.service';

interface BranchesRepoMock {
  createAndSave: jest.Mock;
  findAll: jest.Mock;
  findById: jest.Mock;
  findByCode: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
}

interface PendingRepoMock {
  create: jest.Mock;
  findById: jest.Mock;
  markConsumed: jest.Mock;
  refreshOtp: jest.Mock;
}

const adminUser: User = Object.assign(new User(), {
  id: 'admin-1',
  email: 'admin@ledgerpro.com',
  firstName: 'Ada',
});

// Build a fully-typed PendingBranchAction so tests don't reach for `as unknown
// as PendingBranchAction`. Defaults reflect the most common shape (a valid,
// unexpired create action owned by the seeded admin) — each test overrides the
// handful of fields it cares about.
interface PendingActionOverrides {
  id?: string;
  userId?: string;
  actionType?: PendingBranchActionType;
  branchId?: string | null;
  payload?: PendingBranchActionPayload;
  otpCode?: string;
  expiresAt?: Date;
  consumedAt?: Date | null;
  createdAt?: Date;
}

function buildPendingAction(
  overrides: PendingActionOverrides = {},
): PendingBranchAction {
  const pending = new PendingBranchAction();
  pending.id = overrides.id ?? 'pending-1';
  pending.userId = overrides.userId ?? adminUser.id;
  pending.user = adminUser;
  pending.actionType = overrides.actionType ?? 'create';
  pending.branchId = overrides.branchId ?? null;
  pending.branch = null;
  pending.payload = overrides.payload ?? null;
  pending.otpCode = overrides.otpCode ?? '123456';
  pending.expiresAt = overrides.expiresAt ?? new Date(Date.now() + 60_000);
  pending.consumedAt = overrides.consumedAt ?? null;
  pending.createdAt = overrides.createdAt ?? new Date();
  return pending;
}

function buildBranch(overrides: Partial<Branch> = {}): Branch {
  const branch = new Branch();
  branch.id = overrides.id ?? 'b1';
  branch.code = overrides.code ?? 'BR001';
  branch.name = overrides.name ?? 'Main';
  branch.addressLine1 = overrides.addressLine1 ?? '1 Main St';
  branch.addressLine2 = overrides.addressLine2 ?? null;
  branch.city = overrides.city ?? null;
  branch.state = overrides.state ?? null;
  branch.country = overrides.country ?? null;
  branch.postalCode = overrides.postalCode ?? null;
  branch.phone = overrides.phone ?? '+10000000000';
  branch.email = overrides.email ?? null;
  branch.isActive = overrides.isActive ?? true;
  branch.createdAt = overrides.createdAt ?? new Date();
  branch.updatedAt = overrides.updatedAt ?? new Date();
  return branch;
}

describe('BranchesService — two-step mutations', () => {
  let service: BranchesService;
  let branchesRepo: BranchesRepoMock;
  let pendingRepo: PendingRepoMock;
  let emailService: jest.Mocked<
    Pick<EmailService, 'isVerified' | 'sendBranchActionOtpEmail'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;

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
    pendingRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      markConsumed: jest.fn(),
      refreshOtp: jest.fn(),
    };
    emailService = {
      isVerified: jest.fn().mockReturnValue(true),
      sendBranchActionOtpEmail: jest.fn().mockResolvedValue(undefined),
    };
    usersService = {
      findById: jest.fn().mockResolvedValue(adminUser),
    };

    const module = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: BranchesRepository, useValue: branchesRepo },
        { provide: PendingBranchActionsRepository, useValue: pendingRepo },
        { provide: UsersService, useValue: usersService },
        { provide: EmailService, useValue: emailService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('development') },
        },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Transaction), useValue: {} },
        { provide: getRepositoryToken(TransactionItem), useValue: {} },
        { provide: getRepositoryToken(Inventory), useValue: {} },
        { provide: getRepositoryToken(Expense), useValue: {} },
      ],
    }).compile();

    service = module.get(BranchesService);
  });

  describe('requestCreate', () => {
    it('rejects a duplicate branch code before issuing an OTP', async () => {
      branchesRepo.findByCode.mockResolvedValue(buildBranch({ id: 'other' }));

      await expect(
        service.requestCreate(adminUser.id, {
          code: 'BR099',
          name: 'New',
          addressLine1: '1 Main',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(pendingRepo.create).not.toHaveBeenCalled();
      expect(emailService.sendBranchActionOtpEmail).not.toHaveBeenCalled();
    });

    it('stages the action, emails the OTP, and returns the action id', async () => {
      branchesRepo.findByCode.mockResolvedValue(null);
      pendingRepo.create.mockResolvedValue(
        buildPendingAction({ id: 'pending-1', actionType: 'create' }),
      );

      const result = await service.requestCreate(adminUser.id, {
        code: 'BR099',
        name: 'New',
        addressLine1: '1 Main',
      });

      expect(result.actionId).toBe('pending-1');
      expect(result.action).toBe('create');
      expect(pendingRepo.create).toHaveBeenCalledTimes(1);
      expect(emailService.sendBranchActionOtpEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmAction', () => {
    it("refuses to confirm someone else's pending action", async () => {
      pendingRepo.findById.mockResolvedValue(
        buildPendingAction({ userId: 'someone-else' }),
      );

      await expect(
        service.confirmAction(adminUser.id, 'p1', '123456'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an expired OTP', async () => {
      pendingRepo.findById.mockResolvedValue(
        buildPendingAction({
          expiresAt: new Date(Date.now() - 1000),
          payload: {},
        }),
      );

      await expect(
        service.confirmAction(adminUser.id, 'p1', '123456'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an already-consumed action', async () => {
      pendingRepo.findById.mockResolvedValue(
        buildPendingAction({
          consumedAt: new Date(),
          payload: {},
        }),
      );

      await expect(
        service.confirmAction(adminUser.id, 'p1', '123456'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a wrong OTP', async () => {
      pendingRepo.findById.mockResolvedValue(
        buildPendingAction({ payload: {} }),
      );

      await expect(
        service.confirmAction(adminUser.id, 'p1', '999999'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the branch on a successful create-confirm', async () => {
      pendingRepo.findById.mockResolvedValue(
        buildPendingAction({
          id: 'p1',
          payload: {
            code: 'BR099',
            name: 'New',
            addressLine1: '1 Main',
          },
        }),
      );
      branchesRepo.findByCode.mockResolvedValue(null);
      branchesRepo.createAndSave.mockResolvedValue(
        buildBranch({ id: 'b9', code: 'BR099' }),
      );

      const result = await service.confirmAction(adminUser.id, 'p1', '123456');

      expect(result.action).toBe('create');
      expect(result.branch?.code).toBe('BR099');
      expect(pendingRepo.markConsumed).toHaveBeenCalledWith(
        'p1',
        expect.any(Date),
      );
    });

    it('deletes the branch on a successful delete-confirm', async () => {
      pendingRepo.findById.mockResolvedValue(
        buildPendingAction({
          id: 'p2',
          actionType: 'delete',
          branchId: 'b9',
          otpCode: '654321',
        }),
      );
      branchesRepo.findById.mockResolvedValue(buildBranch({ id: 'b9' }));

      const result = await service.confirmAction(adminUser.id, 'p2', '654321');

      expect(result.action).toBe('delete');
      expect(result.branch).toBeNull();
      expect(branchesRepo.delete).toHaveBeenCalledWith('b9');
      expect(pendingRepo.markConsumed).toHaveBeenCalledTimes(1);
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
