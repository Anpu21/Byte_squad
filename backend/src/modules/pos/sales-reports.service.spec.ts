/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { SalesReportsService } from './sales-reports.service';
import { SalesReportsRepository } from './sales-reports.repository';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };

describe('SalesReportsService', () => {
  let service: SalesReportsService;
  let repo: jest.Mocked<SalesReportsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SalesReportsService,
        {
          provide: SalesReportsRepository,
          useValue: { salesmanSummary: jest.fn() },
        },
      ],
    }).compile();
    service = moduleRef.get(SalesReportsService);
    repo = moduleRef.get(SalesReportsRepository);
    repo.salesmanSummary.mockResolvedValue([]);
  });

  it('pins managers to their own branch', async () => {
    await service.salesman(
      { startDate: '2026-06-01', endDate: '2026-06-30' },
      MANAGER,
    );
    expect(repo.salesmanSummary).toHaveBeenCalledWith({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      branchId: BRANCH_A,
    });
  });

  it('blocks a manager reporting on another branch', async () => {
    await expect(
      service.salesman({ branchId: BRANCH_B }, MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets an admin report across branches or narrow to one', async () => {
    await service.salesman(
      { startDate: '2026-06-01', endDate: '2026-06-30' },
      ADMIN,
    );
    expect(repo.salesmanSummary).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: undefined }),
    );
    await service.salesman(
      { startDate: '2026-06-01', endDate: '2026-06-30', branchId: BRANCH_B },
      ADMIN,
    );
    expect(repo.salesmanSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ branchId: BRANCH_B }),
    );
  });

  it('defaults to a trailing 30-day window ending at the given endDate', async () => {
    const result = await service.salesman({ endDate: '2026-06-30' }, ADMIN);
    expect(result.startDate).toBe('2026-06-01');
    expect(result.endDate).toBe('2026-06-30');
  });

  it('rejects malformed dates and inverted windows', async () => {
    await expect(
      service.salesman({ startDate: 'June 1' }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.salesman(
        { startDate: '2026-07-01', endDate: '2026-06-01' },
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
