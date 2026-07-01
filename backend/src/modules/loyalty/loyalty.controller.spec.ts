/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import type { LoyaltyLookupResult } from './types';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';

const ACTOR: AuthUser = {
  id: 'cashier-1',
  email: 'cashier@ledgerpro.com',
  role: UserRole.CASHIER,
  branchId: 'branch-1',
};

const SAMPLE_RESULT: LoyaltyLookupResult = {
  ownerType: 'user',
  userId: 'user-1',
  loyaltyCustomerId: null,
  tier: 'bronze',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '+94771234567',
  pointsBalance: 100,
  lifetimePointsEarned: 200,
  lifetimePointsRedeemed: 100,
};

const WALK_IN_RESULT: LoyaltyLookupResult = {
  ownerType: 'walkIn',
  userId: null,
  loyaltyCustomerId: 'walkin-1',
  tier: 'bronze',
  firstName: 'Walk',
  lastName: 'In',
  phone: '+94771234567',
  pointsBalance: 0,
  lifetimePointsEarned: 0,
  lifetimePointsRedeemed: 0,
};

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: jest.Mocked<LoyaltyService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<LoyaltyService>> = {
      lookupByPhone: jest.fn(),
      enrollWalkInCustomer: jest.fn(),
      getSettings: jest.fn(),
      getSummary: jest.fn(),
      listHistory: jest.fn(),
      listBranchCustomers: jest.fn(),
      getMemberHistory: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [{ provide: LoyaltyService, useValue: serviceMock }],
    }).compile();

    controller = module.get(LoyaltyController);
    service = module.get(LoyaltyService);
  });

  describe('lookup', () => {
    it('forwards the phone query to the service', async () => {
      service.lookupByPhone.mockResolvedValue(SAMPLE_RESULT);

      const result = await controller.lookup({ phone: '+94771234567' });

      expect(service.lookupByPhone).toHaveBeenCalledWith('+94771234567');
      expect(result).toBe(SAMPLE_RESULT);
    });
  });

  describe('enroll', () => {
    it('forwards the body to the service', async () => {
      service.enrollWalkInCustomer.mockResolvedValue(WALK_IN_RESULT);

      const body = {
        phone: '+94771234567',
        firstName: 'Walk',
        lastName: 'In',
      };
      const result = await controller.enroll(body, ACTOR);

      expect(service.enrollWalkInCustomer).toHaveBeenCalledWith(body, ACTOR);
      expect(result).toBe(WALK_IN_RESULT);
    });
  });

  describe('listBranchCustomers', () => {
    it('forwards the query + actor to the service', async () => {
      const response = { rows: [], total: 0, limit: 20, offset: 0 };
      service.listBranchCustomers.mockResolvedValue(response);

      const result = await controller.listBranchCustomers({ search: 'j' }, ACTOR);

      expect(service.listBranchCustomers).toHaveBeenCalledWith(
        { search: 'j' },
        ACTOR,
      );
      expect(result).toBe(response);
    });
  });

  describe('memberHistory', () => {
    it('forwards the account id, actor, and query to the service', async () => {
      const response = { entries: [], total: 0, limit: 20, offset: 0 };
      service.getMemberHistory.mockResolvedValue(response);

      const result = await controller.memberHistory('acc-1', {}, ACTOR);

      expect(service.getMemberHistory).toHaveBeenCalledWith('acc-1', ACTOR, {});
      expect(result).toBe(response);
    });
  });
});
