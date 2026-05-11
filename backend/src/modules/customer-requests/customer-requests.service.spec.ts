/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CustomerRequestsService } from './customer-requests.service';
import { CustomerRequestsRepository } from './customer-requests.repository';
import { CustomerRequest } from './entities/customer-request.entity';
import { CustomerRequestStatus } from '@common/enums/customer-request.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { ProductsRepository } from '@products/products.repository';
import { BranchesRepository } from '@branches/branches.repository';
import { UsersRepository } from '@users/users.repository';
import { PosRepository } from '@pos/pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';

describe('CustomerRequestsService', () => {
  let service: CustomerRequestsService;
  let repo: jest.Mocked<CustomerRequestsRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<CustomerRequestsRepository>> = {
      buildItem: jest.fn(),
      createAndSave: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      existsByCode: jest.fn(),
      listForUser: jest.fn(),
      listForStaff: jest.fn(),
      updateStatus: jest.fn(),
      setQrCodeUrl: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CustomerRequestsService,
        { provide: CustomerRequestsRepository, useValue: repoMock },
        {
          provide: ProductsRepository,
          useValue: { findActiveByIds: jest.fn() },
        },
        { provide: BranchesRepository, useValue: { findById: jest.fn() } },
        {
          provide: UsersRepository,
          useValue: {
            findManagersAndAdminsForBranches: jest.fn(),
            findByBranchAndRole: jest.fn(),
          },
        },
        {
          provide: PosRepository,
          useValue: { createAndSaveTransaction: jest.fn() },
        },
        {
          provide: AccountingRepository,
          useValue: { createLedgerEntry: jest.fn() },
        },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: NotificationsGateway, useValue: { broadcast: jest.fn() } },
        {
          provide: CloudinaryService,
          useValue: { uploadBuffer: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CustomerRequestsService);
    repo = module.get(CustomerRequestsRepository);
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
        { status: CustomerRequestStatus.PENDING, q: 'foo' },
      );
      expect(repo.listForStaff).toHaveBeenCalledWith(
        expect.objectContaining({
          actorRole: UserRole.MANAGER,
          actorBranchId: 'branch-7',
          status: CustomerRequestStatus.PENDING,
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
        status: CustomerRequestStatus.PENDING,
      } as CustomerRequest);
      await expect(
        service.cancelByUser('r1', 'someone-else'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it('rejects when the request is no longer pending', async () => {
      repo.findById.mockResolvedValue({
        id: 'r1',
        userId: 'owner',
        status: CustomerRequestStatus.ACCEPTED,
      } as CustomerRequest);
      await expect(service.cancelByUser('r1', 'owner')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
