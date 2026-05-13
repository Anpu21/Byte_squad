/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '@users/users.service';
import { EmailService } from '@/modules/email/email.service';
import { User } from '@users/entities/user.entity';
import { UserRole } from '@common/enums/user-roles.enums';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed'),
}));
import * as bcrypt from 'bcrypt';
const mockedCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const usersMock: Partial<jest.Mocked<UsersService>> = {
      findByEmail: jest.fn(),
      findByIdWithPassword: jest.fn(),
      createCustomerAccount: jest.fn(),
      removeByIdInternal: jest.fn(),
      markVerified: jest.fn(),
      setOtp: jest.fn(),
      updatePassword: jest.fn(),
      touchLastLogin: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersMock },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') },
        },
        {
          provide: EmailService,
          useValue: {
            isVerified: jest.fn().mockReturnValue(false),
            sendOtpEmail: jest.fn(),
            sendPasswordResetOtpEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('development') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    users = module.get(UsersService);
  });

  describe('signup', () => {
    it('rejects duplicate emails', async () => {
      users.findByEmail.mockResolvedValue({ id: 'existing' } as User);
      await expect(
        service.signup({
          email: 'a@b.com',
          password: 'Password1!',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('throws Unauthorized when user is missing', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.com', password: 'p' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws Unauthorized for an incorrect password', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'u',
        email: 'x@y.com',
        passwordHash: 'hashed',
        role: UserRole.MANAGER,
        branchId: 'b',
        isFirstLogin: false,
        isVerified: true,
        firstName: 'X',
        lastName: 'Y',
      } as User);
      mockedCompare.mockResolvedValueOnce(false as never);
      await expect(
        service.login({ email: 'x@y.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('blocks unverified customers', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'u',
        email: 'c@x.com',
        passwordHash: 'h',
        role: UserRole.CUSTOMER,
        branchId: null,
        isFirstLogin: false,
        isVerified: false,
        firstName: 'C',
        lastName: 'X',
      } as User);
      mockedCompare.mockResolvedValueOnce(true as never);
      await expect(
        service.login({ email: 'c@x.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('requestPasswordReset', () => {
    it('returns the generic response without revealing missing accounts', async () => {
      users.findByEmail.mockResolvedValue(null);
      const result = await service.requestPasswordReset({
        email: 'unknown@x.com',
      });
      expect(result.message).toMatch(/if an account exists/i);
      expect(users.setOtp).not.toHaveBeenCalled();
    });
  });
});
