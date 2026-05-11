import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerRequestsRepository } from './customer-requests.repository';
import { CustomerRequest } from './entities/customer-request.entity';
import { CustomerRequestItem } from './entities/customer-request-item.entity';
import { CustomerRequestStatus } from '@common/enums/customer-request.enum';
import { UserRole } from '@common/enums/user-roles.enums';

interface QbStub {
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  take: jest.Mock;
  andWhere: jest.Mock;
  getMany: jest.Mock<Promise<CustomerRequest[]>>;
}

function makeQb(): QbStub {
  const qb: QbStub = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    andWhere: jest.fn(),
    getMany: jest.fn<Promise<CustomerRequest[]>, []>().mockResolvedValue([]),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb;
}

describe('CustomerRequestsRepository.listForStaff', () => {
  let repo: CustomerRequestsRepository;
  let qb: QbStub;
  let requestRepoMock: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    qb = makeQb();
    requestRepoMock = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomerRequestsRepository,
        {
          provide: getRepositoryToken(CustomerRequest),
          useValue: requestRepoMock,
        },
        {
          provide: getRepositoryToken(CustomerRequestItem),
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    repo = moduleRef.get(CustomerRequestsRepository);
  });

  it('filters by actor branchId for non-admins', async () => {
    await repo.listForStaff({
      actorRole: UserRole.MANAGER,
      actorBranchId: 'branch-1',
      branchId: null,
      status: null,
      q: null,
      limit: 10,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('req.branch_id = :branchId', {
      branchId: 'branch-1',
    });
  });

  it('honors the explicit branchId for admins', async () => {
    await repo.listForStaff({
      actorRole: UserRole.ADMIN,
      actorBranchId: null,
      branchId: 'branch-9',
      status: null,
      q: null,
      limit: 10,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('req.branch_id = :branchId', {
      branchId: 'branch-9',
    });
  });

  it('restricts cashier visibility to actionable statuses when no status filter is given', async () => {
    await repo.listForStaff({
      actorRole: UserRole.CASHIER,
      actorBranchId: 'branch-1',
      branchId: null,
      status: null,
      q: null,
      limit: 10,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'req.status IN (:...visibleToCashier)',
      {
        visibleToCashier: [
          CustomerRequestStatus.PENDING,
          CustomerRequestStatus.ACCEPTED,
          CustomerRequestStatus.COMPLETED,
        ],
      },
    );
  });
});
