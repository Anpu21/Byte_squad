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
import { BranchesRepository } from '@branches/branches.repository';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { User } from './entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let users: jest.Mocked<UsersRepository>;
  let branches: jest.Mocked<BranchesRepository>;

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
    const branchesMock: Partial<jest.Mocked<BranchesRepository>> = {
      findById: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersMock },
        { provide: BranchesRepository, useValue: branchesMock },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn(() => 24) } },
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
    branches = module.get(BranchesRepository);
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

  describe('create', () => {
    const dto: CreateUserDto = {
      email: 'new@example.com',
      firstName: 'A',
      lastName: 'B',
      role: UserRole.MANAGER,
      branchId: 'b1',
    };
    const adminActor = {
      id: 'admin',
      role: UserRole.ADMIN,
      branchId: 'b1',
    };

    it('rejects non-admins', async () => {
      await expect(
        service.create(dto, {
          id: 'm',
          role: UserRole.MANAGER,
          branchId: 'b1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects duplicate emails', async () => {
      users.findByEmail.mockResolvedValue({ id: 'existing' } as User);
      await expect(service.create(dto, adminActor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('strips passwordHash from returned user', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createAndSave.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        firstName: 'A',
        passwordHash: 'should-be-stripped',
        role: UserRole.MANAGER,
      } as User);
      const result = await service.create(dto, adminActor);
      expect(result.passwordHash).toBeUndefined();
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
});
