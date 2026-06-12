import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsRepository } from './shipments.repository';
import { StockTransfersRepository } from './stock-transfers.repository';
import { EmployeesRepository } from '@/modules/hr/employees.repository';
import { UsersRepository } from '@users/users.repository';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { StockTransferRequest } from './entities/stock-transfer-request.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { TransferStatus } from '@common/enums/transfer-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

const SOURCE = 'branch-source';
const DEST = 'branch-dest';

function line(over: Partial<StockTransferRequest> = {}): StockTransferRequest {
  return {
    id: 'line-1',
    status: TransferStatus.APPROVED,
    shipmentId: null,
    sourceBranchId: SOURCE,
    destinationBranchId: DEST,
    approvedQuantity: 5,
    productId: 'prod-1',
    batchId: 'batch-1',
    ...over,
  } as StockTransferRequest;
}

function courier(over: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-courier',
    employeeCode: 'EMP-1',
    branchId: SOURCE,
    status: 'Active',
    fullName: 'Ravi Bandara',
    userId: 'user-worker',
    ...over,
  } as Employee;
}

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let shipments: jest.Mocked<
    Pick<ShipmentsRepository, 'findById' | 'save' | 'appendEvent' | 'list'>
  >;
  let transfers: jest.Mocked<Pick<StockTransfersRepository, 'findByIds'>>;
  let employees: jest.Mocked<
    Pick<EmployeesRepository, 'findById' | 'findByUserId'>
  >;

  const admin = { id: 'u-admin', role: UserRole.ADMIN, branchId: null };
  const sourceManager = {
    id: 'u-mgr',
    role: UserRole.MANAGER,
    branchId: SOURCE,
  };
  const otherManager = {
    id: 'u-mgr2',
    role: UserRole.MANAGER,
    branchId: 'branch-other',
  };

  beforeEach(() => {
    shipments = {
      findById: jest.fn(),
      save: jest.fn(),
      appendEvent: jest.fn(),
      list: jest.fn(),
    };
    transfers = { findByIds: jest.fn() };
    employees = { findById: jest.fn(), findByUserId: jest.fn() };

    service = new ShipmentsService(
      shipments as unknown as ShipmentsRepository,
      transfers as unknown as StockTransfersRepository,
      employees as unknown as EmployeesRepository,
      {
        findManagersAndAdminsForBranches: jest.fn().mockResolvedValue([]),
      } as unknown as UsersRepository,
      { create: jest.fn() } as unknown as NotificationsService,
      { sendToUser: jest.fn() } as unknown as NotificationsGateway,
      { transaction: jest.fn() } as never,
    );
  });

  describe('createFromLines', () => {
    it('throws NotFound when a requested line is missing', async () => {
      transfers.findByIds.mockResolvedValue([line()]); // asked for 2, got 1
      await expect(
        service.createFromLines(admin, { lineIds: ['line-1', 'line-2'] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a line that is not approved', async () => {
      transfers.findByIds.mockResolvedValue([
        line({ status: TransferStatus.PENDING }),
      ]);
      await expect(
        service.createFromLines(admin, { lineIds: ['line-1'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a line already attached to a shipment', async () => {
      transfers.findByIds.mockResolvedValue([line({ shipmentId: 'ship-x' })]);
      await expect(
        service.createFromLines(admin, { lineIds: ['line-1'] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects lines with mixed source/destination', async () => {
      transfers.findByIds.mockResolvedValue([
        line({ id: 'line-1' }),
        line({ id: 'line-2', sourceBranchId: 'branch-elsewhere' }),
      ]);
      await expect(
        service.createFromLines(admin, { lineIds: ['line-1', 'line-2'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forbids a manager from a non-source branch', async () => {
      transfers.findByIds.mockResolvedValue([line()]);
      await expect(
        service.createFromLines(otherManager, { lineIds: ['line-1'] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('assignCourier', () => {
    it('rejects a courier that belongs to a different branch', async () => {
      shipments.findById.mockResolvedValue({
        id: 'ship-1',
        status: 'pending',
        sourceBranchId: SOURCE,
        destinationBranchId: DEST,
      } as never);
      employees.findById.mockResolvedValue(
        courier({ branchId: 'branch-elsewhere' }),
      );
      await expect(
        service.assignCourier(
          'ship-1',
          { courierEmployeeId: 'emp-courier' },
          sourceManager,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the courier employee does not exist', async () => {
      shipments.findById.mockResolvedValue({
        id: 'ship-1',
        status: 'pending',
        sourceBranchId: SOURCE,
        destinationBranchId: DEST,
      } as never);
      employees.findById.mockResolvedValue(null);
      await expect(
        service.assignCourier(
          'ship-1',
          { courierEmployeeId: 'nope' },
          sourceManager,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns empty for a worker with no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);
      const result = await service.list(
        { id: 'u-worker', role: UserRole.WORKER, branchId: SOURCE },
        {},
      );
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(shipments.list).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('refuses to dispatch without an assigned courier', async () => {
      shipments.findById.mockResolvedValue({
        id: 'ship-1',
        status: 'ready_to_ship',
        sourceBranchId: SOURCE,
        destinationBranchId: DEST,
        courierEmployeeId: null,
      } as never);
      await expect(service.dispatch('ship-1', admin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
