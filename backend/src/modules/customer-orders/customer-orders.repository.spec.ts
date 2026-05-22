import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerOrdersRepository } from './customer-orders.repository';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { PayherePaymentAttempt } from './entities/payhere-payment-attempt.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { UserRole } from '@common/enums/user-roles.enums';

interface QbStub {
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  take: jest.Mock;
  andWhere: jest.Mock;
  getMany: jest.Mock<Promise<CustomerOrder[]>>;
}

function makeQb(): QbStub {
  const qb: QbStub = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    andWhere: jest.fn(),
    getMany: jest.fn<Promise<CustomerOrder[]>, []>().mockResolvedValue([]),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb;
}

describe('CustomerOrdersRepository.listForStaff', () => {
  let repo: CustomerOrdersRepository;
  let qb: QbStub;
  let requestRepoMock: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    qb = makeQb();
    requestRepoMock = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomerOrdersRepository,
        {
          provide: getRepositoryToken(CustomerOrder),
          useValue: requestRepoMock,
        },
        {
          provide: getRepositoryToken(CustomerOrderItem),
          useValue: { create: jest.fn() },
        },
        {
          provide: getRepositoryToken(PayherePaymentAttempt),
          useValue: {},
        },
      ],
    }).compile();

    repo = moduleRef.get(CustomerOrdersRepository);
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
    expect(qb.andWhere).toHaveBeenCalledWith('ord.branch_id = :branchId', {
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
    expect(qb.andWhere).toHaveBeenCalledWith('ord.branch_id = :branchId', {
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
      'ord.status IN (:...visibleToCashier)',
      {
        visibleToCashier: [
          CustomerOrderStatus.PENDING,
          CustomerOrderStatus.ACCEPTED,
          CustomerOrderStatus.COMPLETED,
        ],
      },
    );
  });
});
