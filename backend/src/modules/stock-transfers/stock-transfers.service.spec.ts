/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
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

interface InventoryQB {
  setLock: jest.Mock<InventoryQB, []>;
  where: jest.Mock<InventoryQB, [string, { productId?: string }?]>;
  andWhere: jest.Mock<InventoryQB, [string, { productId?: string }?]>;
  getOne: jest.Mock<Promise<Inventory | null>, []>;
}

describe('StockTransfersService', () => {
  let service: StockTransfersService;
  let transfers: jest.Mocked<StockTransfersRepository>;
  let products: jest.Mocked<ProductsRepository>;
  let branches: jest.Mocked<BranchesRepository>;
  let inventory: jest.Mocked<InventoryRepository>;
  let users: jest.Mocked<UsersRepository>;
  let dataSource: { transaction: jest.Mock };
  let notifications: { create: jest.Mock };
  let gateway: { sendToUser: jest.Mock };

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
    const notificationsMock = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    const gatewayMock = { sendToUser: jest.fn() };
    const dataSourceMock = { transaction: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        StockTransfersService,
        { provide: StockTransfersRepository, useValue: transfersMock },
        { provide: ProductsRepository, useValue: productsMock },
        { provide: BranchesRepository, useValue: branchesMock },
        { provide: InventoryRepository, useValue: inventoryMock },
        { provide: UsersRepository, useValue: usersMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: NotificationsGateway, useValue: gatewayMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get(StockTransfersService);
    transfers = module.get(StockTransfersRepository);
    products = module.get(ProductsRepository);
    branches = module.get(BranchesRepository);
    inventory = module.get(InventoryRepository);
    users = module.get(UsersRepository);
    dataSource = module.get(DataSource);
    notifications = module.get(NotificationsService);
    gateway = module.get(NotificationsGateway);
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

    it('sends a ship-CTA message to source managers and the generic approved message to destination managers', async () => {
      // Arrange — happy path, transfer goes from PENDING to APPROVED.
      // findByIdOrThrow is called twice: once on entry, once after save.
      transfers.findById
        .mockResolvedValueOnce({
          id: 't1',
          status: TransferStatus.PENDING,
          destinationBranchId: 'dst',
          requestedQuantity: 5,
          productId: 'p1',
        } as StockTransferRequest)
        .mockResolvedValueOnce({
          id: 't1',
          status: TransferStatus.APPROVED,
          destinationBranchId: 'dst',
          sourceBranchId: 'src',
          approvedQuantity: 5,
          product: { name: 'Apples' },
          sourceBranch: { name: 'Source' },
          destinationBranch: { name: 'Dest' },
        } as StockTransferRequest);
      branches.findById.mockResolvedValue({
        id: 'src',
        name: 'Source',
        isActive: true,
      } as Branch);
      inventory.findByProductAndBranch.mockResolvedValue({
        quantity: 10,
      } as Inventory);
      transfers.save.mockResolvedValue({} as StockTransferRequest);
      users.findManagersAndAdminsForBranches.mockResolvedValue([
        { id: 'src-mgr', role: UserRole.MANAGER, branchId: 'src' } as never,
        { id: 'dst-mgr', role: UserRole.MANAGER, branchId: 'dst' } as never,
      ]);

      // Act
      await service.approve(
        't1',
        { sourceBranchId: 'src', approvedQuantity: 5 },
        actor,
      );

      // Assert
      expect(notifications.create).toHaveBeenCalledTimes(2);
      const calls = notifications.create.mock.calls.map(
        ([arg]) => arg as { userId: string; title: string; message: string },
      );
      const srcCall = calls.find((c) => c.userId === 'src-mgr');
      const dstCall = calls.find((c) => c.userId === 'dst-mgr');
      expect(srcCall?.title).toBe('Action needed — ship transfer');
      expect(srcCall?.message).toContain('Please ship 5 unit(s) of Apples');
      expect(dstCall?.title).toBe('Stock transfer approved');
      expect(dstCall?.message).toContain('Approved: 5 unit(s) of Apples');
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

    it('rejects an admin creating a transfer without destinationBranchId', async () => {
      products.findById.mockResolvedValue({
        id: 'p',
        name: 'Apples',
      } as never);
      await expect(
        service.create(
          { productId: 'p', requestedQuantity: 2 },
          { id: 'a', role: UserRole.ADMIN, branchId: null },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uses dto.destinationBranchId when an admin creates the transfer', async () => {
      products.findById.mockResolvedValue({
        id: 'p',
        name: 'Apples',
      } as never);
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
        {
          productId: 'p',
          requestedQuantity: 2,
          destinationBranchId: 'b',
        },
        { id: 'a', role: UserRole.ADMIN, branchId: null },
      );

      expect(transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({ destinationBranchId: 'b' }),
      );
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

  describe('createAdminDirect', () => {
    const adminId = 'admin-user-1';
    const srcId = 'src-branch';
    const dstId = 'dst-branch';

    const activeSource = {
      id: srcId,
      name: 'Source',
      isActive: true,
    } as Branch;
    const activeDestination = {
      id: dstId,
      name: 'Destination',
      isActive: true,
    } as Branch;

    function mockActiveBranches() {
      branches.findById.mockImplementation((id: string) => {
        if (id === srcId) return Promise.resolve(activeSource);
        if (id === dstId) return Promise.resolve(activeDestination);
        return Promise.resolve(null);
      });
    }

    function mockProducts(productNames: Record<string, string>) {
      products.findById.mockImplementation((id: string) => {
        if (productNames[id]) {
          return Promise.resolve({ id, name: productNames[id] } as never);
        }
        return Promise.resolve(null);
      });
    }

    function mockTransaction(opts: {
      sourceQtyByProductId: Record<string, number | null>;
    }) {
      const savedTransfers: StockTransferRequest[] = [];
      const transferSave = jest.fn((data: Partial<StockTransferRequest>) => {
        const persisted = {
          ...data,
          id: `t-${savedTransfers.length + 1}`,
        } as StockTransferRequest;
        savedTransfers.push(persisted);
        return Promise.resolve(persisted);
      });

      dataSource.transaction.mockImplementation(
        async (cb: (m: unknown) => Promise<unknown>) => {
          const inventoryRepo = {
            createQueryBuilder: jest.fn((): InventoryQB => {
              let capturedProductId: string | undefined;
              const qb: InventoryQB = {
                setLock: jest.fn(() => qb),
                where: jest.fn(
                  (_sql: string, params?: { productId?: string }) => {
                    if (params?.productId) capturedProductId = params.productId;
                    return qb;
                  },
                ),
                andWhere: jest.fn(
                  (_sql: string, params?: { productId?: string }) => {
                    if (params?.productId) capturedProductId = params.productId;
                    return qb;
                  },
                ),
                getOne: jest.fn(() => {
                  if (!capturedProductId) return Promise.resolve(null);
                  const qty = opts.sourceQtyByProductId[capturedProductId];
                  if (qty === null || qty === undefined) {
                    return Promise.resolve(null);
                  }
                  return Promise.resolve({
                    productId: capturedProductId,
                    branchId: srcId,
                    quantity: qty,
                  } as Inventory);
                }),
              };
              return qb;
            }),
          };

          const transferRepo = {
            create: jest.fn((data: Partial<StockTransferRequest>) => data),
            save: transferSave,
          };

          const manager = {
            getRepository: jest.fn((entity: unknown) => {
              if (entity === Inventory) return inventoryRepo;
              if (entity === StockTransferRequest) return transferRepo;
              throw new Error('Unexpected entity in transaction mock');
            }),
          };

          return cb(manager);
        },
      );

      return { savedTransfers, transferSave };
    }

    it('rejects when source equals destination', async () => {
      // Arrange
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: srcId,
        lines: [{ productId: 'p1', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createAdminDirect(adminId, dto as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects when the source branch is inactive', async () => {
      // Arrange
      branches.findById.mockImplementation((id: string) => {
        if (id === srcId) {
          return Promise.resolve({
            id,
            name: 'Source',
            isActive: false,
          } as Branch);
        }
        if (id === dstId) return Promise.resolve(activeDestination);
        return Promise.resolve(null);
      });
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: dstId,
        lines: [{ productId: 'p1', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createAdminDirect(adminId, dto as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when a product cannot be found', async () => {
      // Arrange
      mockActiveBranches();
      products.findById.mockResolvedValue(null);
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: dstId,
        lines: [{ productId: 'missing-product', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createAdminDirect(adminId, dto as never),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when source has insufficient stock and writes nothing', async () => {
      // Arrange
      mockActiveBranches();
      mockProducts({ p1: 'Apples' });
      const { transferSave } = mockTransaction({
        sourceQtyByProductId: { p1: 5 },
      });
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: dstId,
        lines: [{ productId: 'p1', quantity: 10 }],
      };

      // Act + Assert
      await expect(
        service.createAdminDirect(adminId, dto as never),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(transferSave).not.toHaveBeenCalled();
    });

    it('saves all lines in APPROVED state with the admin as reviewer and shares one batchId', async () => {
      // Arrange
      mockActiveBranches();
      mockProducts({ p1: 'Apples', p2: 'Bananas', p3: 'Carrots' });
      const { savedTransfers, transferSave } = mockTransaction({
        sourceQtyByProductId: { p1: 100, p2: 100, p3: 100 },
      });
      transfers.findById.mockImplementation((id: string) =>
        Promise.resolve({ id } as StockTransferRequest),
      );
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: dstId,
        lines: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 3 },
          { productId: 'p3', quantity: 5 },
        ],
      };

      // Act
      const result = await service.createAdminDirect(adminId, dto as never);

      // Assert
      expect(transferSave).toHaveBeenCalledTimes(3);
      const seenBatchIds = new Set<string>();
      for (const call of transferSave.mock.calls) {
        const [data] = call as [Partial<StockTransferRequest>];
        expect(data.status).toBe(TransferStatus.APPROVED);
        expect(data.requestedByUserId).toBe(adminId);
        expect(data.reviewedByUserId).toBe(adminId);
        expect(data.sourceBranchId).toBe(srcId);
        expect(data.destinationBranchId).toBe(dstId);
        expect(data.requestedQuantity).toBe(data.approvedQuantity);
        expect(data.batchId).toBeTruthy();
        if (data.batchId) seenBatchIds.add(data.batchId);
      }
      expect(seenBatchIds.size).toBe(1);
      expect(savedTransfers).toHaveLength(3);
      expect(result).toHaveLength(3);
    });

    it('dedupes lines with the same productId by summing quantities', async () => {
      // Arrange
      mockActiveBranches();
      mockProducts({ p1: 'Apples' });
      const { transferSave } = mockTransaction({
        sourceQtyByProductId: { p1: 100 },
      });
      transfers.findById.mockImplementation((id: string) =>
        Promise.resolve({ id } as StockTransferRequest),
      );
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: dstId,
        lines: [
          { productId: 'p1', quantity: 3 },
          { productId: 'p1', quantity: 5 },
        ],
      };

      // Act
      await service.createAdminDirect(adminId, dto as never);

      // Assert
      expect(transferSave).toHaveBeenCalledTimes(1);
      const [persisted] = transferSave.mock.calls[0] as [
        Partial<StockTransferRequest>,
      ];
      expect(persisted.productId).toBe('p1');
      expect(persisted.requestedQuantity).toBe(8);
      expect(persisted.approvedQuantity).toBe(8);
    });

    it('fires one notification per recipient per batch', async () => {
      // Arrange
      mockActiveBranches();
      mockProducts({ p1: 'Apples', p2: 'Bananas' });
      const recipients = [{ id: 'mgr-1' } as never, { id: 'mgr-2' } as never];
      users.findManagersAndAdminsForBranches.mockResolvedValue(recipients);
      mockTransaction({
        sourceQtyByProductId: { p1: 100, p2: 100 },
      });
      transfers.findById.mockImplementation((id: string) =>
        Promise.resolve({ id } as StockTransferRequest),
      );
      const dto = {
        sourceBranchId: srcId,
        destinationBranchId: dstId,
        lines: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 4 },
        ],
      };

      // Act
      await service.createAdminDirect(adminId, dto as never);

      // Assert — 1 batch × 2 recipients = 2 fan-outs (was 4 per-line)
      expect(notifications.create).toHaveBeenCalledTimes(2);
      expect(gateway.sendToUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('createManagerBatch', () => {
    const managerId = 'manager-user-1';
    const branchId = 'manager-branch';
    const actor = {
      id: managerId,
      role: UserRole.MANAGER,
      branchId,
    };
    const activeBranch = {
      id: branchId,
      name: 'Downtown',
      isActive: true,
    } as Branch;

    function mockProducts(productNames: Record<string, string>) {
      products.findById.mockImplementation((id: string) => {
        if (productNames[id]) {
          return Promise.resolve({ id, name: productNames[id] } as never);
        }
        return Promise.resolve(null);
      });
    }

    function mockTransaction() {
      const savedTransfers: StockTransferRequest[] = [];
      const transferSave = jest.fn((data: Partial<StockTransferRequest>) => {
        const persisted = {
          ...data,
          id: `t-${savedTransfers.length + 1}`,
        } as StockTransferRequest;
        savedTransfers.push(persisted);
        return Promise.resolve(persisted);
      });

      dataSource.transaction.mockImplementation(
        async (cb: (m: unknown) => Promise<unknown>) => {
          const transferRepo = {
            create: jest.fn((data: Partial<StockTransferRequest>) => data),
            save: transferSave,
          };
          const manager = {
            getRepository: jest.fn((entity: unknown) => {
              if (entity === StockTransferRequest) return transferRepo;
              throw new Error('Unexpected entity in transaction mock');
            }),
          };
          return cb(manager);
        },
      );

      return { savedTransfers, transferSave };
    }

    it('rejects when the actor has no branch', async () => {
      // Arrange
      const noBranchActor = {
        id: 'a',
        role: UserRole.ADMIN,
        branchId: null,
      };
      const dto = {
        lines: [{ productId: 'p1', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createManagerBatch(noBranchActor, dto as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('rejects when the destination branch is inactive', async () => {
      // Arrange
      branches.findById.mockResolvedValue({
        id: branchId,
        name: 'Downtown',
        isActive: false,
      } as Branch);
      const dto = {
        lines: [{ productId: 'p1', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createManagerBatch(actor, dto as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when a product cannot be found', async () => {
      // Arrange
      branches.findById.mockResolvedValue(activeBranch);
      products.findById.mockResolvedValue(null);
      const dto = {
        lines: [{ productId: 'missing', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createManagerBatch(actor, dto as never),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('saves all lines as PENDING with the manager as requester and shares one batchId', async () => {
      // Arrange
      branches.findById.mockResolvedValue(activeBranch);
      mockProducts({ p1: 'Apples', p2: 'Bananas', p3: 'Carrots' });
      const { savedTransfers, transferSave } = mockTransaction();
      transfers.findById.mockImplementation((id: string) =>
        Promise.resolve({ id } as StockTransferRequest),
      );
      const dto = {
        requestReason: 'low stock',
        lines: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 3 },
          { productId: 'p3', quantity: 5 },
        ],
      };

      // Act
      const result = await service.createManagerBatch(actor, dto as never);

      // Assert
      expect(transferSave).toHaveBeenCalledTimes(3);
      const seenBatchIds = new Set<string>();
      for (const call of transferSave.mock.calls) {
        const [data] = call as [Partial<StockTransferRequest>];
        expect(data.status).toBe(TransferStatus.PENDING);
        expect(data.requestedByUserId).toBe(managerId);
        expect(data.destinationBranchId).toBe(branchId);
        expect(data.requestReason).toBe('low stock');
        expect(data.approvedQuantity).toBeUndefined();
        expect(data.batchId).toBeTruthy();
        if (data.batchId) seenBatchIds.add(data.batchId);
      }
      expect(seenBatchIds.size).toBe(1);
      expect(savedTransfers).toHaveLength(3);
      expect(result).toHaveLength(3);
    });

    it('dedupes lines with the same productId by summing quantities', async () => {
      // Arrange
      branches.findById.mockResolvedValue(activeBranch);
      mockProducts({ p1: 'Apples' });
      const { transferSave } = mockTransaction();
      transfers.findById.mockImplementation((id: string) =>
        Promise.resolve({ id } as StockTransferRequest),
      );
      const dto = {
        requestReason: 'restock',
        lines: [
          { productId: 'p1', quantity: 3 },
          { productId: 'p1', quantity: 5 },
        ],
      };

      // Act
      await service.createManagerBatch(actor, dto as never);

      // Assert
      expect(transferSave).toHaveBeenCalledTimes(1);
      const [persisted] = transferSave.mock.calls[0] as [
        Partial<StockTransferRequest>,
      ];
      expect(persisted.productId).toBe('p1');
      expect(persisted.requestedQuantity).toBe(8);
    });

    it('fans out one notification per admin per batch', async () => {
      // Arrange
      branches.findById.mockResolvedValue(activeBranch);
      mockProducts({ p1: 'Apples', p2: 'Bananas' });
      const admins = [{ id: 'admin-1' } as never, { id: 'admin-2' } as never];
      users.findAllByRole.mockResolvedValue(admins);
      mockTransaction();
      transfers.findById.mockImplementation((id: string) =>
        Promise.resolve({ id } as StockTransferRequest),
      );
      const dto = {
        requestReason: 'restock',
        lines: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 4 },
        ],
      };

      // Act
      await service.createManagerBatch(actor, dto as never);

      // Assert — 1 batch × 2 admins = 2 fan-outs (was 4 per-line)
      expect(notifications.create).toHaveBeenCalledTimes(2);
      expect(gateway.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('rejects when requestReason is empty after trim', async () => {
      // Arrange
      branches.findById.mockResolvedValue(activeBranch);
      mockProducts({ p1: 'Apples' });
      const dto = {
        requestReason: '   ',
        lines: [{ productId: 'p1', quantity: 1 }],
      };

      // Act + Assert
      await expect(
        service.createManagerBatch(actor, dto as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });
  });
});
