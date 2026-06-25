/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service';
import { CustomerOrdersRepository } from './customer-orders.repository';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { CustomerOrderPaymentStatus } from '@common/enums/customer-order-payment-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { ProductsService } from '@products/products.service';
import { BranchesService } from '@branches/branches.service';
import { UsersService } from '@users/users.service';
import { PosService } from '@pos/pos.service';
import { AccountingService } from '@accounting/accounting.service';
import { InventoryService } from '@inventory/inventory.service';
import { LoyaltyService } from '@/modules/loyalty-wallets/loyalty.service';
import { LoyaltyWalletService } from '@/modules/loyalty-wallets/loyalty-wallet.service';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { PayhereService } from './payhere.service';

describe('CustomerOrdersService', () => {
  let service: CustomerOrdersService;
  let repo: jest.Mocked<CustomerOrdersRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<CustomerOrdersRepository>> = {
      buildItem: jest.fn(),
      createAndSave: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      existsByCode: jest.fn(),
      listForUser: jest.fn(),
      listForStaff: jest.fn(),
      updateStatus: jest.fn(),
      setQrCodeUrl: jest.fn(),
      updateFinancials: jest.fn(),
      updatePaymentStatus: jest.fn(),
      createPaymentAttempt: jest.fn(),
      findPaymentAttemptByProviderOrderId: jest.fn(),
      updatePaymentAttempt: jest.fn(),
      hasSuccessfulPaymentAttempt: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CustomerOrdersService,
        { provide: CustomerOrdersRepository, useValue: repoMock },
        {
          provide: ProductsService,
          useValue: { findActiveByIds: jest.fn() },
        },
        { provide: BranchesService, useValue: { findEntityById: jest.fn() } },
        {
          provide: UsersService,
          useValue: {
            findManagersAndAdminsForBranches: jest.fn(),
            findByBranchAndRole: jest.fn(),
          },
        },
        {
          provide: PosService,
          useValue: { createAndSaveTransaction: jest.fn() },
        },
        {
          provide: AccountingService,
          useValue: { createLedgerEntry: jest.fn() },
        },
        {
          provide: InventoryService,
          useValue: { decrementStockBatch: jest.fn() },
        },
        {
          provide: LoyaltyService,
          useValue: {
            getPointValue: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: LoyaltyWalletService,
          useValue: {
            redeemForOrder: jest.fn().mockResolvedValue(0),
            reverseRedemption: jest.fn().mockResolvedValue(0),
            awardForOrder: jest.fn().mockResolvedValue(0),
          },
        },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: NotificationsGateway, useValue: { broadcast: jest.fn() } },
        {
          provide: CloudinaryService,
          useValue: { uploadBuffer: jest.fn() },
        },
        {
          provide: PayhereService,
          useValue: {
            createCheckoutPayload: jest.fn(),
            verifyNotifySignature: jest.fn(),
            isMerchantValid: jest.fn(),
            formatAmount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CustomerOrdersService);
    repo = module.get(CustomerOrdersRepository);
  });

  describe('listForStaff', () => {
    it('short-circuits to [] for non-admin staff with no branchId, without hitting the repo', async () => {
      const result = await service.listForStaff(
        { id: 'user-1', role: UserRole.MANAGER, branchId: null },
        {},
      );
      expect(result).toEqual([]);
      expect(repo.listForStaff).not.toHaveBeenCalled();
    });

    it('passes actor branch and query filters into the repo for branch-scoped staff', async () => {
      repo.listForStaff.mockResolvedValue([]);
      await service.listForStaff(
        { id: 'm1', role: UserRole.MANAGER, branchId: 'branch-7' },
        { status: CustomerOrderStatus.PENDING, q: 'foo' },
      );
      expect(repo.listForStaff).toHaveBeenCalledWith(
        expect.objectContaining({
          actorRole: UserRole.MANAGER,
          actorBranchId: 'branch-7',
          status: CustomerOrderStatus.PENDING,
          q: 'foo',
          limit: 200,
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the repo returns null', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('cancelByUser', () => {
    it('rejects when the user does not own the request', async () => {
      repo.findById.mockResolvedValue({
        id: 'r1',
        userId: 'owner',
        status: CustomerOrderStatus.PENDING,
      } as CustomerOrder);
      await expect(
        service.cancelByUser('r1', 'someone-else'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it('rejects when the request is no longer pending', async () => {
      repo.findById.mockResolvedValue({
        id: 'r1',
        userId: 'owner',
        status: CustomerOrderStatus.ACCEPTED,
      } as CustomerOrder);
      await expect(service.cancelByUser('r1', 'owner')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('markNotCollected', () => {
    const actor = { id: 'c1', role: UserRole.CASHIER, branchId: 'branch-7' };

    it('forbids marking an order from another branch (non-admin)', async () => {
      repo.findById.mockResolvedValue({
        id: 'o1',
        branchId: 'branch-OTHER',
        status: CustomerOrderStatus.PENDING,
      } as CustomerOrder);
      await expect(
        service.markNotCollected('o1', actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it('rejects an order that is no longer awaiting collection', async () => {
      repo.findById.mockResolvedValue({
        id: 'o1',
        branchId: 'branch-7',
        status: CustomerOrderStatus.COMPLETED,
      } as CustomerOrder);
      await expect(
        service.markNotCollected('o1', actor),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it('marks an unpaid pickup not collected and cancels the payment hold', async () => {
      repo.findById.mockResolvedValue({
        id: 'o1',
        branchId: 'branch-7',
        status: CustomerOrderStatus.PENDING,
        paymentStatus: CustomerOrderPaymentStatus.UNPAID,
        loyaltyPointsRedeemed: 0,
      } as CustomerOrder);
      await service.markNotCollected('o1', actor);
      expect(repo.updateStatus).toHaveBeenCalledWith(
        'o1',
        CustomerOrderStatus.NOT_COLLECTED,
        { paymentStatus: CustomerOrderPaymentStatus.CANCELLED },
      );
    });

    it('keeps a PAID online order paid when marking not collected', async () => {
      repo.findById.mockResolvedValue({
        id: 'o1',
        branchId: 'branch-7',
        status: CustomerOrderStatus.PENDING,
        paymentStatus: CustomerOrderPaymentStatus.PAID,
        loyaltyPointsRedeemed: 0,
      } as CustomerOrder);
      await service.markNotCollected('o1', actor);
      expect(repo.updateStatus).toHaveBeenCalledWith(
        'o1',
        CustomerOrderStatus.NOT_COLLECTED,
        undefined,
      );
    });
  });
});
