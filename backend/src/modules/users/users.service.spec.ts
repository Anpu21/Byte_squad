/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { BranchesService } from '@branches/branches.service';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { User } from './entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const ADMIN_USER_ID = 'admin-id';
const TARGET_USER_ID = 'target-id';

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
  let branches: jest.Mocked<BranchesService>;
  let emailService: jest.Mocked<EmailService>;
  let loyalty: jest.Mocked<LoyaltyService>;

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
    const branchesMock: Partial<jest.Mocked<BranchesService>> = {
      findEntityById: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersMock },
        { provide: BranchesService, useValue: branchesMock },
        {
          provide: EmailService,
          useValue: {
            isVerified: jest.fn().mockReturnValue(false),
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(24) },
        },
        {
          provide: CloudinaryService,
          useValue: {
            isEnabled: jest.fn().mockReturnValue(false),
            uploadImage: jest.fn(),
          },
        },
        {
          provide: LoyaltyService,
          useValue: { syncVerifiedUserByPhone: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    users = module.get(UsersRepository);
    branches = module.get(BranchesService);
    emailService = module.get(EmailService);
    loyalty = module.get(LoyaltyService);
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
      branches.findEntityById.mockResolvedValue({
        id: 'b1',
        name: 'X',
        isActive: false,
      } as Branch);
      await expect(service.updateMyBranch('u1', 'b1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('loyalty sync', () => {
    it('syncs a customer wallet after email verification when phone is present', async () => {
      users.findById.mockResolvedValue(
        makeTarget({
          id: 'customer-1',
          role: UserRole.CUSTOMER,
          phone: '+94771234567',
        }),
      );
      await service.markVerified('customer-1');

      expect(users.update).toHaveBeenCalledWith(
        'customer-1',
        expect.objectContaining({ isVerified: true }),
      );
      expect(loyalty.syncVerifiedUserByPhone).toHaveBeenCalledWith(
        'customer-1',
      );
    });

    it('normalizes profile phone updates before syncing loyalty', async () => {
      users.findById.mockResolvedValue(
        makeTarget({
          id: 'customer-1',
          role: UserRole.CUSTOMER,
          phone: null,
        }),
      );
      users.findByIdWithBranch.mockResolvedValue(
        makeTarget({
          id: 'customer-1',
          role: UserRole.CUSTOMER,
          phone: '+94771234567',
        }),
      );
      await service.updateProfile('customer-1', { phone: '077 123 4567' });

      expect(users.update).toHaveBeenCalledWith('customer-1', {
        phone: '+94771234567',
      });
      expect(loyalty.syncVerifiedUserByPhone).toHaveBeenCalledWith(
        'customer-1',
      );
    });
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      email: 'new@example.com',
      firstName: 'A',
      lastName: 'B',
      role: UserRole.MANAGER,
      branchId: 'b1',
    };

    it('rejects assignment of CUSTOMER role on create', async () => {
      await expect(
        service.create(ADMIN_USER_ID, {
          ...dto,
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(users.createAndSave).not.toHaveBeenCalled();
    });

    it('rejects duplicate emails', async () => {
      users.findByEmail.mockResolvedValue({ id: 'existing' } as User);
      await expect(service.create(ADMIN_USER_ID, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(users.createAndSave).not.toHaveBeenCalled();
    });

    it('persists the user and triggers the welcome email', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createAndSave.mockResolvedValue(
        makeTarget({
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
        }),
      );

      const result = await service.create(ADMIN_USER_ID, dto);

      expect(users.createAndSave).toHaveBeenCalledTimes(1);
      const createArg = users.createAndSave.mock.calls[0][0];
      expect(createArg).toMatchObject({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        branchId: dto.branchId,
        isFirstLogin: true,
        isVerified: false,
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result.email).toBe(dto.email);
    });
  });

  describe('update', () => {
    it('throws NotFound when target missing', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.update(ADMIN_USER_ID, TARGET_USER_ID, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids self-management', async () => {
      users.findById.mockResolvedValue(
        makeTarget({ id: ADMIN_USER_ID, email: 'admin@example.com' }),
      );
      await expect(
        service.update(ADMIN_USER_ID, ADMIN_USER_ID, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects email collisions on a different user', async () => {
      users.findById.mockResolvedValue(makeTarget());
      users.findByEmail.mockResolvedValue(
        makeTarget({ id: 'someone-else', email: 'taken@example.com' }),
      );
      await expect(
        service.update(ADMIN_USER_ID, TARGET_USER_ID, {
          email: 'taken@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.update).not.toHaveBeenCalled();
    });

    it('updates the user and returns the refreshed record', async () => {
      users.findById.mockResolvedValue(makeTarget());
      users.findByIdWithBranch.mockResolvedValue(
        makeTarget({ firstName: 'Grace' }),
      );
      const dto: UpdateUserDto = { firstName: 'Grace' };

      const result = await service.update(ADMIN_USER_ID, TARGET_USER_ID, dto);

      expect(users.update).toHaveBeenCalledWith(
        TARGET_USER_ID,
        expect.objectContaining({ firstName: 'Grace' }),
      );
      expect(result?.firstName).toBe('Grace');
    });
  });

  describe('delete', () => {
    it('throws NotFound when target missing', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.delete(ADMIN_USER_ID, TARGET_USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids self-deletion', async () => {
      users.findById.mockResolvedValue(
        makeTarget({ id: ADMIN_USER_ID, email: 'admin@example.com' }),
      );
      await expect(
        service.delete(ADMIN_USER_ID, ADMIN_USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('deletes the target user', async () => {
      users.findById.mockResolvedValue(makeTarget());
      await service.delete(ADMIN_USER_ID, TARGET_USER_ID);
      expect(users.delete).toHaveBeenCalledWith(TARGET_USER_ID);
    });
  });

  describe('resetPassword', () => {
    it('throws NotFound when target missing', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.resetPassword(ADMIN_USER_ID, TARGET_USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids resetting own password through this endpoint', async () => {
      users.findById.mockResolvedValue(
        makeTarget({ id: ADMIN_USER_ID, email: 'admin@example.com' }),
      );
      await expect(
        service.resetPassword(ADMIN_USER_ID, ADMIN_USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('issues a new temp password and emails the user', async () => {
      users.findById.mockResolvedValue(makeTarget());
      users.findByIdWithBranch.mockResolvedValue(makeTarget());

      const result = await service.resetPassword(ADMIN_USER_ID, TARGET_USER_ID);

      expect(users.update).toHaveBeenCalledWith(
        TARGET_USER_ID,
        expect.objectContaining({
          isFirstLogin: true,
          isVerified: false,
        }),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });
});
