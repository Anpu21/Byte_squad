/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockTransfersService } from './stock-transfers.service';
import { StockTransfersRepository } from './stock-transfers.repository';
import { ProductsRepository } from '@products/products.repository';
import { BranchesRepository } from '@branches/branches.repository';
import { InventoryRepository } from '@inventory/inventory.repository';
import { UsersRepository } from '@users/users.repository';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { StockTransferRequest } from './entities/stock-transfer-request.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { TransferStatus } from '@common/enums/transfer-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

describe('StockTransfersService', () => {
  let service: StockTransfersService;
  let transfers: jest.Mocked<StockTransfersRepository>;
  let products: jest.Mocked<ProductsRepository>;
  let branches: jest.Mocked<BranchesRepository>;
  let inventory: jest.Mocked<InventoryRepository>;
  let users: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const transfersMock: Partial<jest.Mocked<StockTransfersRepository>> = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      listForAdmin: jest.fn(),
      listMyRequests: jest.fn(),
      listIncoming: jest.fn(),
      listHistory: jest.fn(),
    };
    const productsMock: Partial<jest.Mocked<ProductsRepository>> = {
      findById: jest.fn(),
    };
    const branchesMock: Partial<jest.Mocked<BranchesRepository>> = {
      findById: jest.fn(),
      findAllSortedByName: jest.fn(),
    };
    const inventoryMock: Partial<jest.Mocked<InventoryRepository>> = {
      findByProductAndBranch: jest.fn(),
      findByProductInBranches: jest.fn(),
    };
    const usersMock: Partial<jest.Mocked<UsersRepository>> = {
      findAllByRole: jest.fn().mockResolvedValue([]),
      findManagersAndAdminsForBranches: jest.fn().mockResolvedValue([]),
    };
    const notifications = { create: jest.fn().mockResolvedValue(undefined) };
    const gateway = { sendToUser: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        StockTransfersService,
        { provide: StockTransfersRepository, useValue: transfersMock },
        { provide: ProductsRepository, useValue: productsMock },
        { provide: BranchesRepository, useValue: branchesMock },
        { provide: InventoryRepository, useValue: inventoryMock },
        { provide: UsersRepository, useValue: usersMock },
        { provide: NotificationsService, useValue: notifications },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get(StockTransfersService);
    transfers = module.get(StockTransfersRepository);
    products = module.get(ProductsRepository);
    branches = module.get(BranchesRepository);
    inventory = module.get(InventoryRepository);
    users = module.get(UsersRepository);
  });

  describe('approve', () => {
    const actor = {
      id: 'admin',
      role: UserRole.ADMIN,
      branchId: 'whatever',
    };

    it('rejects approval for a non-pending transfer', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        status: TransferStatus.APPROVED,
      } as StockTransferRequest);
      await expect(
        service.approve(
          't1',
          { sourceBranchId: 'src', approvedQuantity: 1 },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when source equals destination', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        status: TransferStatus.PENDING,
        destinationBranchId: 'b',
        requestedQuantity: 5,
      } as StockTransferRequest);
      await expect(
        service.approve(
          't1',
          { sourceBranchId: 'b', approvedQuantity: 1 },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when approved exceeds requested', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        status: TransferStatus.PENDING,
        destinationBranchId: 'dst',
        requestedQuantity: 3,
      } as StockTransferRequest);
      await expect(
        service.approve(
          't1',
          { sourceBranchId: 'src', approvedQuantity: 5 },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an inactive source branch', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        status: TransferStatus.PENDING,
        destinationBranchId: 'dst',
        requestedQuantity: 5,
        productId: 'p1',
      } as StockTransferRequest);
      branches.findById.mockResolvedValue({
        id: 'src',
        isActive: false,
      } as Branch);
      await expect(
        service.approve(
          't1',
          { sourceBranchId: 'src', approvedQuantity: 1 },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when source has insufficient stock', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        status: TransferStatus.PENDING,
        destinationBranchId: 'dst',
        requestedQuantity: 5,
        productId: 'p1',
      } as StockTransferRequest);
      branches.findById.mockResolvedValue({
        id: 'src',
        isActive: true,
      } as Branch);
      inventory.findByProductAndBranch.mockResolvedValue({
        quantity: 1,
      } as Inventory);
      await expect(
        service.approve(
          't1',
          { sourceBranchId: 'src', approvedQuantity: 5 },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findById access control', () => {
    it('blocks managers viewing transfers from a different branch', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        destinationBranchId: 'b1',
        sourceBranchId: 'b2',
      } as StockTransferRequest);
      await expect(
        service.findById('t1', {
          id: 'm',
          role: UserRole.MANAGER,
          branchId: 'b3',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets admins through unconditionally', async () => {
      transfers.findById.mockResolvedValue({
        id: 't1',
        destinationBranchId: 'b1',
        sourceBranchId: 'b2',
      } as StockTransferRequest);
      const result = await service.findById('t1', {
        id: 'a',
        role: UserRole.ADMIN,
        branchId: 'whatever',
      });
      expect(result.id).toBe('t1');
    });
  });

  describe('create', () => {
    it('throws NotFoundException when product is missing', async () => {
      products.findById.mockResolvedValue(null);
      await expect(
        service.create(
          { productId: 'p', requestedQuantity: 1 },
          { id: 'u', role: UserRole.MANAGER, branchId: 'b' },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('uses repos to fan out admin notifications on create', async () => {
    products.findById.mockResolvedValue({ id: 'p', name: 'Apples' } as never);
    branches.findById.mockResolvedValue({
      id: 'b',
      name: 'Main',
    } as Branch);
    transfers.create.mockResolvedValue({ id: 't1' } as StockTransferRequest);
    transfers.findById.mockResolvedValue({
      id: 't1',
      destinationBranchId: 'b',
      sourceBranchId: null,
    } as StockTransferRequest);
    await service.create(
      { productId: 'p', requestedQuantity: 2 },
      { id: 'u', role: UserRole.MANAGER, branchId: 'b' },
    );
    expect(users.findAllByRole).toHaveBeenCalledWith(UserRole.ADMIN);
  });
});

