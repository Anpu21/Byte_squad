/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { LoyaltyWalletService } from './loyalty-wallet.service';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyRepository } from './loyalty.repository';
import { LoyaltySettingsService } from '@/modules/loyalty-settings/loyalty-settings.service';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from './entities/loyalty-ledger-entry.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import { LoyaltySettings } from '@/modules/loyalty-settings/entities/loyalty-settings.entity';

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

function makeSettings(): LoyaltySettings {
  return {
    id: 'settings',
    earnPoints: 1,
    earnPerAmount: 100,
    pointValue: 1,
    redeemCapPercent: 20,
    minRedeemablePoints: 100,
    silverTierPoints: 1000,
    goldTierPoints: 5000,
    updatedByUserId: null,
    updatedAt: new Date(),
  } as LoyaltySettings;
}

describe('LoyaltyWalletService', () => {
  let service: LoyaltyWalletService;
  let loyaltyRepo: jest.Mocked<LoyaltyRepository>;
  let loyaltyService: jest.Mocked<LoyaltyService>;

  beforeEach(async () => {
    const loyaltyRepoMock: Partial<jest.Mocked<LoyaltyRepository>> = {
      findLedgerEntry: jest.fn(),
      createLedgerEntry: jest.fn(),
      applyRedeem: jest.fn(),
      applyRedeemReversal: jest.fn(),
      applyEarn: jest.fn(),
      applyEarnReversal: jest.fn(),
    };
    const loyaltyServiceMock: Partial<jest.Mocked<LoyaltyService>> = {
      getOrCreateAccount: jest.fn(),
      getPointValue: jest.fn().mockResolvedValue(1),
    };
    const settingsMock: Partial<jest.Mocked<LoyaltySettingsService>> = {
      get: jest.fn().mockResolvedValue(makeSettings()),
    };

    const module = await Test.createTestingModule({
      providers: [
        LoyaltyWalletService,
        { provide: LoyaltyRepository, useValue: loyaltyRepoMock },
        { provide: LoyaltySettingsService, useValue: settingsMock },
        { provide: LoyaltyService, useValue: loyaltyServiceMock },
      ],
    }).compile();

    service = module.get(LoyaltyWalletService);
    loyaltyRepo = module.get(LoyaltyRepository);
    loyaltyService = module.get(LoyaltyService);
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());
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
        undefined,
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeWalkInAccount());
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
        undefined,
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());
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
        undefined,
      );
    });

    it('debits points for a walk-in wallet', async () => {
      loyaltyService.getOrCreateAccount.mockResolvedValue(
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
        undefined,
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());

      // 20% of 1000 = 200 cap, point value 1, reserve 100 -> max 150 points
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());
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
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());
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
        undefined,
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

  describe('reverseEarnForOrder', () => {
    it('subtracts earned points and writes an earn_reversed ledger row', async () => {
      loyaltyRepo.findLedgerEntry
        .mockResolvedValueOnce({ points: 30 } as LoyaltyLedgerEntry)
        .mockResolvedValueOnce(null);
      loyaltyRepo.createLedgerEntry.mockResolvedValue({} as LoyaltyLedgerEntry);

      const result = await service.reverseEarnForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
        branchId: 'branch-1',
      });

      expect(result).toBe(30);
      expect(loyaltyRepo.applyEarnReversal).toHaveBeenCalledWith(
        { userId: USER_ID },
        30,
        undefined,
      );
      const ledger = loyaltyRepo.createLedgerEntry.mock.calls[0][0];
      expect(ledger).toMatchObject({
        userId: USER_ID,
        branchId: 'branch-1',
        type: LoyaltyLedgerEntryType.EARN_REVERSED,
        points: 30,
      });
    });

    it('is idempotent when earn reversal already exists', async () => {
      loyaltyRepo.findLedgerEntry
        .mockResolvedValueOnce({ points: 30 } as LoyaltyLedgerEntry)
        .mockResolvedValueOnce({ points: 30 } as LoyaltyLedgerEntry);

      const result = await service.reverseEarnForOrder({
        owner: { userId: USER_ID },
        orderId: ORDER_ID,
        orderCode: ORDER_CODE,
      });

      expect(result).toBe(0);
      expect(loyaltyRepo.applyEarnReversal).not.toHaveBeenCalled();
    });
  });

  describe('previewRedeemValue', () => {
    it('returns zeros and reads no wallet when owner is null', async () => {
      const result = await service.previewRedeemValue({
        owner: null,
        itemsSubtotal: 1000,
        requestedPoints: 100,
      });

      expect(result).toEqual({
        cappedPoints: 0,
        redeemValue: 0,
        pointValue: 1,
      });
      expect(loyaltyService.getOrCreateAccount).not.toHaveBeenCalled();
    });

    it('returns zeros when requested points is zero', async () => {
      const result = await service.previewRedeemValue({
        owner: { userId: USER_ID },
        itemsSubtotal: 1000,
        requestedPoints: 0,
      });

      expect(result.cappedPoints).toBe(0);
      expect(result.redeemValue).toBe(0);
      expect(loyaltyService.getOrCreateAccount).not.toHaveBeenCalled();
    });

    it('sizes the redeem value without writing any ledger row', async () => {
      // balance 250, subtotal 1000 → cap = min(250-100, 1000*20%) = 150
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());

      const result = await service.previewRedeemValue({
        owner: { userId: USER_ID },
        itemsSubtotal: 1000,
        requestedPoints: 100,
      });

      expect(result.cappedPoints).toBe(100);
      expect(result.redeemValue).toBe(100); // 100 pts * pointValue 1
      expect(loyaltyService.getOrCreateAccount).toHaveBeenCalledTimes(1);
      expect(loyaltyRepo.applyRedeem).not.toHaveBeenCalled();
      expect(loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });

    it('clamps the request down to the server cap', async () => {
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());

      const result = await service.previewRedeemValue({
        owner: { userId: USER_ID },
        itemsSubtotal: 1000,
        requestedPoints: 300, // above the 150 cap
      });

      expect(result.cappedPoints).toBe(150);
      expect(result.redeemValue).toBe(150);
    });

    it('prices the redeem value at the current pointValue', async () => {
      loyaltyService.getOrCreateAccount.mockResolvedValue(makeUserAccount());
      loyaltyService.getPointValue.mockResolvedValue(2);

      const result = await service.previewRedeemValue({
        owner: { userId: USER_ID },
        itemsSubtotal: 1000,
        requestedPoints: 300,
      });

      expect(result.cappedPoints).toBe(150);
      expect(result.redeemValue).toBe(300); // 150 pts * 2
      expect(result.pointValue).toBe(2);
    });
  });
});
