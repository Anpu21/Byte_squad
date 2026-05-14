/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PendingUserActionsRepository } from './pending-user-actions.repository';
import { BranchesRepository } from '@branches/branches.repository';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { User } from './entities/user.entity';
import { PendingUserAction } from './entities/pending-user-action.entity';
import { Branch } from '@branches/entities/branch.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const ADMIN_USER_ID = 'admin-id';
const TARGET_USER_ID = 'target-id';
const ACTION_ID = 'action-id';

function makeAdmin(overrides: Partial<User> = {}): User {
  return {
    id: ADMIN_USER_ID,
    email: 'admin@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: UserRole.ADMIN,
    branchId: null,
    phone: null,
    address: null,
    passwordHash: 'x',
    avatarUrl: null,
    isFirstLogin: false,
    isVerified: true,
    otpCode: null,
    otpExpiresAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    branch: null,
    ...overrides,
  } as User;
}

function makeTarget(overrides: Partial<User> = {}): User {
  return makeAdmin({
    id: TARGET_USER_ID,
    email: 'target@example.com',
    firstName: 'Grace',
    lastName: 'Hopper',
    role: UserRole.MANAGER,
    ...overrides,
  });
}

describe('UsersService', () => {
  let service: UsersService;
  let users: jest.Mocked<UsersRepository>;
  let pending: jest.Mocked<PendingUserActionsRepository>;
  let branches: jest.Mocked<BranchesRepository>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const usersMock: Partial<jest.Mocked<UsersRepository>> = {
      createAndSave: jest.fn(),
      findById: jest.fn(),
      findByIdWithBranch: jest.fn(),
      findByEmail: jest.fn(),
      findAllScoped: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const pendingMock: Partial<jest.Mocked<PendingUserActionsRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      markConsumed: jest.fn(),
      refreshOtp: jest.fn(),
    };
    const branchesMock: Partial<jest.Mocked<BranchesRepository>> = {
      findById: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersMock },
        {
          provide: PendingUserActionsRepository,
          useValue: pendingMock,
        },
        { provide: BranchesRepository, useValue: branchesMock },
        {
          provide: EmailService,
          useValue: {
            isVerified: jest.fn().mockReturnValue(false),
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendUserActionOtpEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('development') },
        },
        {
          provide: CloudinaryService,
          useValue: {
            isEnabled: jest.fn().mockReturnValue(false),
            uploadImage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    users = module.get(UsersRepository);
    pending = module.get(PendingUserActionsRepository);
    branches = module.get(BranchesRepository);
    emailService = module.get(EmailService);
  });

  describe('findAll', () => {
    it('passes branchId scope for non-admins', async () => {
      users.findAllScoped.mockResolvedValue([]);
      await service.findAll({
        id: 'u',
        role: UserRole.MANAGER,
        branchId: 'b1',
      });
      expect(users.findAllScoped).toHaveBeenCalledWith('b1');
    });

    it('passes null (= unscoped) for admins', async () => {
      users.findAllScoped.mockResolvedValue([]);
      await service.findAll({
        id: 'u',
        role: UserRole.ADMIN,
        branchId: 'whatever',
      });
      expect(users.findAllScoped).toHaveBeenCalledWith(null);
    });
  });

  describe('updateMyBranch', () => {
    it('refuses non-customer roles', async () => {
      users.findById.mockResolvedValue({
        id: 'u1',
        role: UserRole.MANAGER,
      } as User);
      await expect(service.updateMyBranch('u1', 'b1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('refuses inactive branches', async () => {
      users.findById.mockResolvedValue({
        id: 'u1',
        role: UserRole.CUSTOMER,
        email: 'c@x',
      } as User);
      branches.findById.mockResolvedValue({
        id: 'b1',
        name: 'X',
        isActive: false,
      } as Branch);
      await expect(service.updateMyBranch('u1', 'b1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('requestCreate', () => {
    const dto: CreateUserDto = {
      email: 'new@example.com',
      firstName: 'A',
      lastName: 'B',
      role: UserRole.MANAGER,
      branchId: 'b1',
    };

    it('rejects assignment of CUSTOMER role on create', async () => {
      await expect(
        service.requestCreate(ADMIN_USER_ID, {
          ...dto,
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects duplicate emails before staging', async () => {
      users.findByEmail.mockResolvedValue({ id: 'existing' } as User);
      await expect(
        service.requestCreate(ADMIN_USER_ID, dto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(pending.create).not.toHaveBeenCalled();
    });

    it('stages a pending action and returns actionId + expiresAt', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.findById.mockResolvedValue(makeAdmin());
      pending.create.mockResolvedValue({
        id: ACTION_ID,
        userId: ADMIN_USER_ID,
        actionType: 'create',
        targetUserId: null,
        payload: { ...dto },
        otpCode: '123456',
        expiresAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
        user: makeAdmin(),
        targetUser: null,
      } as PendingUserAction);

      const result = await service.requestCreate(ADMIN_USER_ID, dto);

      expect(pending.create).toHaveBeenCalled();
      const stagedArg = pending.create.mock.calls[0][0];
      expect(stagedArg).toMatchObject({
        userId: ADMIN_USER_ID,
        actionType: 'create',
        targetUserId: null,
      });
      expect(result.actionId).toBe(ACTION_ID);
      expect(result.action).toBe('create');
    });
  });

  describe('requestUpdate', () => {
    it('throws NotFound when target missing', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.requestUpdate(ADMIN_USER_ID, TARGET_USER_ID, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids self-management', async () => {
      users.findById.mockResolvedValue(
        makeTarget({ id: ADMIN_USER_ID, email: 'admin@example.com' }),
      );
      await expect(
        service.requestUpdate(ADMIN_USER_ID, ADMIN_USER_ID, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('stages an update with the dto payload', async () => {
      users.findById
        .mockResolvedValueOnce(makeTarget()) // target lookup
        .mockResolvedValueOnce(makeAdmin()); // admin lookup in stageAction
      users.findByEmail.mockResolvedValue(null);
      pending.create.mockResolvedValue({
        id: ACTION_ID,
        userId: ADMIN_USER_ID,
        actionType: 'update',
        targetUserId: TARGET_USER_ID,
        payload: { firstName: 'Grace' },
        otpCode: '111111',
        expiresAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
        user: makeAdmin(),
        targetUser: makeTarget(),
      } as PendingUserAction);

      const dto: UpdateUserDto = { firstName: 'Grace' };
      const result = await service.requestUpdate(
        ADMIN_USER_ID,
        TARGET_USER_ID,
        dto,
      );

      expect(result.action).toBe('update');
      expect(pending.create).toHaveBeenCalled();
    });
  });

  describe('requestDelete', () => {
    it('throws NotFound when target missing', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.requestDelete(ADMIN_USER_ID, TARGET_USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids self-deletion', async () => {
      users.findById.mockResolvedValue(
        makeTarget({ id: ADMIN_USER_ID, email: 'admin@example.com' }),
      );
      await expect(
        service.requestDelete(ADMIN_USER_ID, ADMIN_USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('requestResetPassword', () => {
    it('throws NotFound when target missing', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.requestResetPassword(ADMIN_USER_ID, TARGET_USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('stages a reset-password action', async () => {
      users.findById
        .mockResolvedValueOnce(makeTarget())
        .mockResolvedValueOnce(makeAdmin());
      pending.create.mockResolvedValue({
        id: ACTION_ID,
        userId: ADMIN_USER_ID,
        actionType: 'reset-password',
        targetUserId: TARGET_USER_ID,
        payload: null,
        otpCode: '222222',
        expiresAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
        user: makeAdmin(),
        targetUser: makeTarget(),
      } as PendingUserAction);

      const result = await service.requestResetPassword(
        ADMIN_USER_ID,
        TARGET_USER_ID,
      );
      expect(result.action).toBe('reset-password');
    });
  });

  describe('confirmAction', () => {
    const futureExpiry = () => new Date(Date.now() + 5 * 60 * 1000);
    const pastExpiry = () => new Date(Date.now() - 5 * 60 * 1000);

    function makePending(
      overrides: Partial<PendingUserAction> = {},
    ): PendingUserAction {
      return {
        id: ACTION_ID,
        userId: ADMIN_USER_ID,
        actionType: 'create',
        targetUserId: null,
        payload: null,
        otpCode: '123456',
        expiresAt: futureExpiry(),
        consumedAt: null,
        createdAt: new Date(),
        user: makeAdmin(),
        targetUser: null,
        ...overrides,
      } as PendingUserAction;
    }

    it('throws NotFound when action is missing', async () => {
      pending.findById.mockResolvedValue(null);
      await expect(
        service.confirmAction(ADMIN_USER_ID, ACTION_ID, '123456'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("forbids confirming another admin's action", async () => {
      pending.findById.mockResolvedValue(
        makePending({ userId: 'other-admin' }),
      );
      await expect(
        service.confirmAction(ADMIN_USER_ID, ACTION_ID, '123456'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects already-consumed actions', async () => {
      pending.findById.mockResolvedValue(
        makePending({ consumedAt: new Date() }),
      );
      await expect(
        service.confirmAction(ADMIN_USER_ID, ACTION_ID, '123456'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects expired actions', async () => {
      pending.findById.mockResolvedValue(
        makePending({ expiresAt: pastExpiry() }),
      );
      await expect(
        service.confirmAction(ADMIN_USER_ID, ACTION_ID, '123456'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects wrong OTP', async () => {
      pending.findById.mockResolvedValue(makePending());
      await expect(
        service.confirmAction(ADMIN_USER_ID, ACTION_ID, '999999'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the user and marks the action consumed on create happy path', async () => {
      const dto: CreateUserDto = {
        email: 'new@example.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.MANAGER,
        branchId: 'b1',
      };
      pending.findById.mockResolvedValue(
        makePending({
          actionType: 'create',
          payload: { ...dto },
        }),
      );
      users.findByEmail.mockResolvedValue(null);
      users.createAndSave.mockResolvedValue(
        makeTarget({
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
        }),
      );

      const result = await service.confirmAction(
        ADMIN_USER_ID,
        ACTION_ID,
        '123456',
      );

      expect(users.createAndSave).toHaveBeenCalled();
      expect(pending.markConsumed).toHaveBeenCalledWith(
        ACTION_ID,
        expect.any(Date),
      );
      expect(result.action).toBe('create');
      expect(result.user).not.toBeNull();
    });

    it('throws Conflict when email was claimed between request and confirm', async () => {
      const dto: CreateUserDto = {
        email: 'race@example.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.MANAGER,
        branchId: 'b1',
      };
      pending.findById.mockResolvedValue(
        makePending({ actionType: 'create', payload: { ...dto } }),
      );
      users.findByEmail.mockResolvedValue(
        makeTarget({ id: 'someone-else', email: dto.email }),
      );

      await expect(
        service.confirmAction(ADMIN_USER_ID, ACTION_ID, '123456'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.createAndSave).not.toHaveBeenCalled();
      expect(pending.markConsumed).not.toHaveBeenCalled();
    });

    it('updates the target user on update happy path', async () => {
      pending.findById.mockResolvedValue(
        makePending({
          actionType: 'update',
          targetUserId: TARGET_USER_ID,
          payload: { firstName: 'Grace' },
        }),
      );
      users.findById
        .mockResolvedValueOnce(makeTarget()) // first lookup in update branch
        .mockResolvedValueOnce(null); // findById inside findById->findByIdWithBranch path uses findByIdWithBranch
      users.findByIdWithBranch.mockResolvedValue(
        makeTarget({ firstName: 'Grace' }),
      );

      const result = await service.confirmAction(
        ADMIN_USER_ID,
        ACTION_ID,
        '123456',
      );

      expect(users.update).toHaveBeenCalledWith(
        TARGET_USER_ID,
        expect.objectContaining({ firstName: 'Grace' }),
      );
      expect(result.action).toBe('update');
    });

    it('deletes the target user on delete happy path', async () => {
      pending.findById.mockResolvedValue(
        makePending({
          actionType: 'delete',
          targetUserId: TARGET_USER_ID,
        }),
      );
      users.findById.mockResolvedValue(makeTarget());

      const result = await service.confirmAction(
        ADMIN_USER_ID,
        ACTION_ID,
        '123456',
      );

      expect(users.delete).toHaveBeenCalledWith(TARGET_USER_ID);
      expect(result.user).toBeNull();
      expect(pending.markConsumed).toHaveBeenCalled();
    });

    it('resets the password and emails the user on reset-password happy path', async () => {
      pending.findById.mockResolvedValue(
        makePending({
          actionType: 'reset-password',
          targetUserId: TARGET_USER_ID,
        }),
      );
      users.findById.mockResolvedValue(makeTarget());
      users.findByIdWithBranch.mockResolvedValue(makeTarget());

      const result = await service.confirmAction(
        ADMIN_USER_ID,
        ACTION_ID,
        '123456',
      );

      expect(users.update).toHaveBeenCalledWith(
        TARGET_USER_ID,
        expect.objectContaining({
          isFirstLogin: true,
          isVerified: false,
        }),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.action).toBe('reset-password');
    });
  });

  describe('resendActionOtp', () => {
    it('throws NotFound when action is missing', async () => {
      pending.findById.mockResolvedValue(null);
      await expect(
        service.resendActionOtp(ADMIN_USER_ID, ACTION_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("forbids resending another admin's action", async () => {
      pending.findById.mockResolvedValue({
        id: ACTION_ID,
        userId: 'other-admin',
        actionType: 'create',
        targetUserId: null,
        payload: null,
        otpCode: '111111',
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
        createdAt: new Date(),
        user: makeAdmin({ id: 'other-admin' }),
        targetUser: null,
      } as PendingUserAction);
      await expect(
        service.resendActionOtp(ADMIN_USER_ID, ACTION_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refreshes the OTP and returns a fresh expiry', async () => {
      pending.findById.mockResolvedValue({
        id: ACTION_ID,
        userId: ADMIN_USER_ID,
        actionType: 'create',
        targetUserId: null,
        payload: { email: 'x@y.com' },
        otpCode: 'old',
        expiresAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
        user: makeAdmin(),
        targetUser: null,
      } as PendingUserAction);
      users.findById.mockResolvedValue(makeAdmin());

      const result = await service.resendActionOtp(ADMIN_USER_ID, ACTION_ID);

      expect(pending.refreshOtp).toHaveBeenCalledWith(
        ACTION_ID,
        expect.any(String),
        expect.any(Date),
      );
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });
});
