/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyRepository } from './loyalty.repository';
import { LoyaltyCustomersRepository } from './loyalty-customers.repository';
import { LoyaltySettingsService } from './loyalty-settings.service';
import { UsersRepository } from '@users/users.repository';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyCustomer } from './entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from './entities/loyalty-ledger-entry.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import { LoyaltySettings } from './entities/loyalty-settings.entity';
import { User } from '@users/entities/user.entity';
import { UserRole } from '@common/enums/user-roles.enums';

const USER_ID = 'user-1';
const WALK_IN_ID = 'walkin-1';
const ORDER_ID = 'order-1';
const ORDER_CODE = 'ORD-001';

function makeUserAccount(
  overrides: Partial<LoyaltyAccount> = {},
): LoyaltyAccount {
  return {
    id: 'acc-user-1',
    userId: USER_ID,
    loyaltyCustomerId: null,
    pointsBalance: 250,
    lifetimePointsEarned: 500,
    lifetimePointsRedeemed: 250,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as LoyaltyAccount;
}

function makeWalkInAccount(
  overrides: Partial<LoyaltyAccount> = {},
): LoyaltyAccount {
  return {
    id: 'acc-walkin-1',
    userId: null,
    loyaltyCustomerId: WALK_IN_ID,
    pointsBalance: 0,
    lifetimePointsEarned: 0,
    lifetimePointsRedeemed: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as LoyaltyAccount;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    branchId: null,
    phone: '+94771234567',
    address: null,
    passwordHash: 'x',
    avatarUrl: null,
    isFirstLogin: false,
    isVerified: true,
    otpCode: null,
    otpExpiresAt: null,
    lastLoginAt: null,
    currentBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    branch: null,
    ...overrides,
  } as User;
}

function makeWalkInCustomer(
  overrides: Partial<LoyaltyCustomer> = {},
): LoyaltyCustomer {
  return {
    id: WALK_IN_ID,
    phone: '+94771234567',
    firstName: 'Jane',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as LoyaltyCustomer;
}

function makeSettings(): LoyaltySettings {
  return {
    id: 'settings',
    earnPoints: 1,
    earnPerAmount: 100,
    pointValue: 1,
    redeemCapPercent: 20,
    updatedByUserId: null,
    updatedAt: new Date(),
  } as LoyaltySettings;
}

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let loyaltyRepo: jest.Mocked<LoyaltyRepository>;
  let customersRepo: jest.Mocked<LoyaltyCustomersRepository>;
  let usersRepo: jest.Mocked<UsersRepository>;
  let settings: jest.Mocked<LoyaltySettingsService>;

  beforeEach(async () => {
    const loyaltyRepoMock: Partial<jest.Mocked<LoyaltyRepository>> = {
      findAccountByUser: jest.fn(),
      findAccountByLoyaltyCustomer: jest.fn(),
      createAccountForUser: jest.fn(),
      createAccountForLoyaltyCustomer: jest.fn(),
      findLedgerEntry: jest.fn(),
      createLedgerEntry: jest.fn(),
      applyRedeem: jest.fn(),
      applyRedeemReversal: jest.fn(),
      applyEarn: jest.fn(),
    };
    const customersRepoMock: Partial<jest.Mocked<LoyaltyCustomersRepository>> =
      {
        findByPhone: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
      };
    const usersRepoMock: Partial<jest.Mocked<UsersRepository>> = {
      findByPhone: jest.fn(),
    };
    const settingsMock: Partial<jest.Mocked<LoyaltySettingsService>> = {
      get: jest.fn().mockResolvedValue(makeSettings()),
    };

    const module = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: LoyaltyRepository, useValue: loyaltyRepoMock },
        { provide: LoyaltyCustomersRepository, useValue: customersRepoMock },
        { provide: UsersRepository, useValue: usersRepoMock },
        { provide: LoyaltySettingsService, useValue: settingsMock },
      ],
    }).compile();

    service = module.get(LoyaltyService);
    loyaltyRepo = module.get(LoyaltyRepository);
    customersRepo = module.get(LoyaltyCustomersRepository);
    usersRepo = module.get(UsersRepository);
    settings = module.get(LoyaltySettingsService);
  });

  describe('getOrCreateAccount', () => {
    it('returns the existing user-owned account when present', async () => {
      const existing = makeUserAccount();
      loyaltyRepo.findAccountByUser.mockResolvedValue(existing);

      const result = await service.getOrCreateAccount({ userId: USER_ID });

      expect(result).toBe(existing);
      expect(loyaltyRepo.findAccountByUser).toHaveBeenCalledWith(USER_ID);
      expect(loyaltyRepo.createAccountForUser).not.toHaveBeenCalled();
    });

    it('creates a new user-owned account when none exists', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(null);
      const created = makeUserAccount({ pointsBalance: 0 });
      loyaltyRepo.createAccountForUser.mockResolvedValue(created);

      const result = await service.getOrCreateAccount({ userId: USER_ID });

      expect(result).toBe(created);
      expect(loyaltyRepo.createAccountForUser).toHaveBeenCalledWith(USER_ID);
    });

    it('returns the existing walk-in account when present', async () => {
      const existing = makeWalkInAccount();
      loyaltyRepo.findAccountByLoyaltyCustomer.mockResolvedValue(existing);

      const result = await service.getOrCreateAccount({
        loyaltyCustomerId: WALK_IN_ID,
      });

      expect(result).toBe(existing);
      expect(loyaltyRepo.findAccountByLoyaltyCustomer).toHaveBeenCalledWith(
        WALK_IN_ID,
      );
      expect(
        loyaltyRepo.createAccountForLoyaltyCustomer,
      ).not.toHaveBeenCalled();
    });

    it('creates a new walk-in account when none exists', async () => {
      loyaltyRepo.findAccountByLoyaltyCustomer.mockResolvedValue(null);
      const created = makeWalkInAccount();
      loyaltyRepo.createAccountForLoyaltyCustomer.mockResolvedValue(created);

      const result = await service.getOrCreateAccount({
        loyaltyCustomerId: WALK_IN_ID,
      });

      expect(result).toBe(created);
      expect(loyaltyRepo.createAccountForLoyaltyCustomer).toHaveBeenCalledWith(
        WALK_IN_ID,
      );
    });

    it('throws when neither userId nor loyaltyCustomerId is provided', async () => {
      await expect(
        service.getOrCreateAccount({} as unknown as { userId: string }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('lookupByPhone', () => {
    it('prefers a registered user over a walk-in record (user-side wins)', async () => {
      const user = makeUser();
      usersRepo.findByPhone.mockResolvedValue(user);
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());

      const result = await service.lookupByPhone('+94771234567');

      expect(result.ownerType).toBe('user');
      expect(result.userId).toBe(USER_ID);
      expect(result.loyaltyCustomerId).toBeNull();
      expect(result.pointsBalance).toBe(250);
      expect(customersRepo.findByPhone).not.toHaveBeenCalled();
    });

    it('falls through to walk-in when no user matches', async () => {
      usersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.findByPhone.mockResolvedValue(makeWalkInCustomer());
      loyaltyRepo.findAccountByLoyaltyCustomer.mockResolvedValue(
        makeWalkInAccount({ pointsBalance: 42 }),
      );

      const result = await service.lookupByPhone('+94771234567');

      expect(result.ownerType).toBe('walkIn');
      expect(result.userId).toBeNull();
      expect(result.loyaltyCustomerId).toBe(WALK_IN_ID);
      expect(result.pointsBalance).toBe(42);
    });

    it('throws NotFound when neither side has the phone', async () => {
      usersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.findByPhone.mockResolvedValue(null);

      await expect(
        service.lookupByPhone('+94771234567'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest when the phone does not normalize', async () => {
      await expect(service.lookupByPhone('garbage')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(usersRepo.findByPhone).not.toHaveBeenCalled();
    });

    it('normalizes mixed-format input before hitting the DB', async () => {
      usersRepo.findByPhone.mockResolvedValue(makeUser());
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());

      await service.lookupByPhone('077 123 4567');

      expect(usersRepo.findByPhone).toHaveBeenCalledWith('+94771234567');
    });
  });

  describe('enrollWalkInCustomer', () => {
    it('creates a walk-in customer + wallet on the happy path', async () => {
      usersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.create.mockResolvedValue(makeWalkInCustomer());
      loyaltyRepo.findAccountByLoyaltyCustomer.mockResolvedValue(null);
      loyaltyRepo.createAccountForLoyaltyCustomer.mockResolvedValue(
        makeWalkInAccount(),
      );

      const result = await service.enrollWalkInCustomer({
        phone: '+94771234567',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(customersRepo.create).toHaveBeenCalledWith({
        phone: '+94771234567',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      expect(loyaltyRepo.createAccountForLoyaltyCustomer).toHaveBeenCalledWith(
        WALK_IN_ID,
      );
      expect(result.ownerType).toBe('walkIn');
      expect(result.loyaltyCustomerId).toBe(WALK_IN_ID);
      expect(result.pointsBalance).toBe(0);
    });

    it('coerces an empty lastName to null and stores it that way', async () => {
      usersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.create.mockResolvedValue(
        makeWalkInCustomer({ lastName: null }),
      );
      loyaltyRepo.createAccountForLoyaltyCustomer.mockResolvedValue(
        makeWalkInAccount(),
      );

      await service.enrollWalkInCustomer({
        phone: '+94771234567',
        firstName: 'Jane',
        lastName: '   ',
      });

      expect(customersRepo.create).toHaveBeenCalledWith({
        phone: '+94771234567',
        firstName: 'Jane',
        lastName: null,
      });
    });

    it('rejects when the phone already belongs to a registered user', async () => {
      usersRepo.findByPhone.mockResolvedValue(makeUser());

      await expect(
        service.enrollWalkInCustomer({
          phone: '+94771234567',
          firstName: 'Jane',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(customersRepo.create).not.toHaveBeenCalled();
    });

    it('rejects when a walk-in already exists for the phone', async () => {
      usersRepo.findByPhone.mockResolvedValue(null);
      customersRepo.findByPhone.mockResolvedValue(makeWalkInCustomer());

      await expect(
        service.enrollWalkInCustomer({
          phone: '+94771234567',
          firstName: 'Jane',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(customersRepo.create).not.toHaveBeenCalled();
    });

    it('rejects when the phone does not normalize', async () => {
      await expect(
        service.enrollWalkInCustomer({
          phone: 'not-a-phone',
          firstName: 'Jane',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(usersRepo.findByPhone).not.toHaveBeenCalled();
    });
  });

  describe('awardForOrder', () => {
    it('returns 0 and writes nothing when owner is null', async () => {
      const result = await service.awardForOrder({
        owner: null,
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        paidAmount: 500,
      });
      expect(result).toBe(0);
      expect(loyaltyRepo.applyEarn).not.toHaveBeenCalled();
    });

    it('credits points to a user-side wallet and writes a ledger row', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());
      loyaltyRepo.findLedgerEntry.mockResolvedValue(null);
      loyaltyRepo.createLedgerEntry.mockResolvedValue({} as LoyaltyLedgerEntry);

      const result = await service.awardForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        paidAmount: 1000,
      });

      expect(result).toBe(10);
      expect(loyaltyRepo.applyEarn).toHaveBeenCalledWith(
        { userId: USER_ID },
        10,
      );
      const ledger = loyaltyRepo.createLedgerEntry.mock.calls[0][0];
      expect(ledger).toMatchObject({
        userId: USER_ID,
        loyaltyCustomerId: null,
        orderId: ORDER_ID,
        type: LoyaltyLedgerEntryType.EARNED,
        points: 10,
      });
    });

    it('credits points to a walk-in wallet with branchId stamped on the ledger', async () => {
      loyaltyRepo.findAccountByLoyaltyCustomer.mockResolvedValue(
        makeWalkInAccount(),
      );
      loyaltyRepo.findLedgerEntry.mockResolvedValue(null);
      loyaltyRepo.createLedgerEntry.mockResolvedValue({} as LoyaltyLedgerEntry);

      const result = await service.awardForOrder({
        owner: { loyaltyCustomerId: WALK_IN_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        paidAmount: 500,
        branchId: 'branch-9',
      });

      expect(result).toBe(5);
      expect(loyaltyRepo.applyEarn).toHaveBeenCalledWith(
        { loyaltyCustomerId: WALK_IN_ID },
        5,
      );
      const ledger = loyaltyRepo.createLedgerEntry.mock.calls[0][0];
      expect(ledger).toMatchObject({
        userId: null,
        loyaltyCustomerId: WALK_IN_ID,
        branchId: 'branch-9',
        type: LoyaltyLedgerEntryType.EARNED,
      });
    });

    it('is idempotent — second call returns the same earn without re-applying', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());
      loyaltyRepo.findLedgerEntry.mockResolvedValue({
        points: 10,
      } as LoyaltyLedgerEntry);

      const result = await service.awardForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        paidAmount: 1000,
      });

      expect(result).toBe(10);
      expect(loyaltyRepo.applyEarn).not.toHaveBeenCalled();
      expect(loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });
  });

  describe('redeemForOrder', () => {
    it('returns 0 when requested points is zero', async () => {
      const result = await service.redeemForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        subtotal: 1000,
        requestedPoints: 0,
      });
      expect(result).toBe(0);
      expect(loyaltyRepo.applyRedeem).not.toHaveBeenCalled();
    });

    it('debits points for a user-side wallet', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());
      loyaltyRepo.findLedgerEntry.mockResolvedValue(null);
      loyaltyRepo.applyRedeem.mockResolvedValue(true);
      loyaltyRepo.createLedgerEntry.mockResolvedValue({} as LoyaltyLedgerEntry);

      const result = await service.redeemForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        subtotal: 1000,
        requestedPoints: 100,
      });

      expect(result).toBe(100);
      expect(loyaltyRepo.applyRedeem).toHaveBeenCalledWith(
        { userId: USER_ID },
        100,
      );
    });

    it('debits points for a walk-in wallet', async () => {
      loyaltyRepo.findAccountByLoyaltyCustomer.mockResolvedValue(
        makeWalkInAccount({ pointsBalance: 200 }),
      );
      loyaltyRepo.findLedgerEntry.mockResolvedValue(null);
      loyaltyRepo.applyRedeem.mockResolvedValue(true);
      loyaltyRepo.createLedgerEntry.mockResolvedValue({} as LoyaltyLedgerEntry);

      const result = await service.redeemForOrder({
        owner: { loyaltyCustomerId: WALK_IN_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        subtotal: 1000,
        requestedPoints: 100,
        branchId: 'branch-7',
      });

      expect(result).toBe(100);
      expect(loyaltyRepo.applyRedeem).toHaveBeenCalledWith(
        { loyaltyCustomerId: WALK_IN_ID },
        100,
      );
      const ledger = loyaltyRepo.createLedgerEntry.mock.calls[0][0];
      expect(ledger).toMatchObject({
        userId: null,
        loyaltyCustomerId: WALK_IN_ID,
        branchId: 'branch-7',
        type: LoyaltyLedgerEntryType.REDEEMED,
      });
    });

    it('rejects when requested points exceed the redeem cap', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());

      // 20% of 1000 = 200 cap, point value 1 -> max 200 points
      await expect(
        service.redeemForOrder({
          owner: { userId: USER_ID },
          orderId: ORDER_ID,
          orderCode: ORDER_CODE,
          subtotal: 1000,
          requestedPoints: 300,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when applyRedeem returns false (race / insufficient balance)', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());
      loyaltyRepo.findLedgerEntry.mockResolvedValue(null);
      loyaltyRepo.applyRedeem.mockResolvedValue(false);

      await expect(
        service.redeemForOrder({
          owner: { userId: USER_ID },
          orderId: ORDER_ID,
          orderCode: ORDER_CODE,
          subtotal: 1000,
          requestedPoints: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('is idempotent — second call returns the same redemption', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(makeUserAccount());
      loyaltyRepo.findLedgerEntry.mockResolvedValue({
        points: 100,
      } as LoyaltyLedgerEntry);

      const result = await service.redeemForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        subtotal: 1000,
        requestedPoints: 100,
      });

      expect(result).toBe(100);
      expect(loyaltyRepo.applyRedeem).not.toHaveBeenCalled();
    });
  });

  describe('reverseRedemption', () => {
    it('returns 0 when there is nothing to reverse', async () => {
      loyaltyRepo.findLedgerEntry.mockResolvedValue(null);
      const result = await service.reverseRedemption({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
      });
      expect(result).toBe(0);
      expect(loyaltyRepo.applyRedeemReversal).not.toHaveBeenCalled();
    });

    it('reverses a redeemed entry for a walk-in wallet', async () => {
      loyaltyRepo.findLedgerEntry
        .mockResolvedValueOnce({ points: 50 } as LoyaltyLedgerEntry) // REDEEMED
        .mockResolvedValueOnce(null); // REVERSED
      loyaltyRepo.createLedgerEntry.mockResolvedValue({} as LoyaltyLedgerEntry);

      const result = await service.reverseRedemption({
        owner: { loyaltyCustomerId: WALK_IN_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        branchId: 'branch-1',
      });

      expect(result).toBe(50);
      expect(loyaltyRepo.applyRedeemReversal).toHaveBeenCalledWith(
        { loyaltyCustomerId: WALK_IN_ID },
        50,
      );
      const ledger = loyaltyRepo.createLedgerEntry.mock.calls[0][0];
      expect(ledger).toMatchObject({
        userId: null,
        loyaltyCustomerId: WALK_IN_ID,
        branchId: 'branch-1',
        type: LoyaltyLedgerEntryType.REVERSED,
      });
    });

    it('skips when a reversal is already on file', async () => {
      loyaltyRepo.findLedgerEntry
        .mockResolvedValueOnce({ points: 50 } as LoyaltyLedgerEntry)
        .mockResolvedValueOnce({ points: 50 } as LoyaltyLedgerEntry);

      const result = await service.reverseRedemption({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
      });

      expect(result).toBe(0);
      expect(loyaltyRepo.applyRedeemReversal).not.toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('still works for legacy user-only callers', async () => {
      loyaltyRepo.findAccountByUser.mockResolvedValue(
        makeUserAccount({
          pointsBalance: 100,
          lifetimePointsEarned: 200,
          lifetimePointsRedeemed: 100,
        }),
      );

      const result = await service.getSummary(USER_ID);

      expect(result).toEqual({
        pointsBalance: 100,
        lifetimePointsEarned: 200,
        lifetimePointsRedeemed: 100,
      });
      expect(settings.get).not.toHaveBeenCalled();
    });
  });
});
