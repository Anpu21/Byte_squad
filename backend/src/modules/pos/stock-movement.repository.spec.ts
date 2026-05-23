import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { StockMovementRepository } from './stock-movement.repository';

interface FakeRepo {
  save: jest.Mock;
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
}

interface FakeQb {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
}

function buildQb(rows: unknown[]): FakeQb {
  const qb: FakeQb = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn().mockResolvedValue(rows),
  };
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  return qb;
}

describe('StockMovementRepository', () => {
  let repo: StockMovementRepository;
  let typeormRepo: FakeRepo;
  let dataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    typeormRepo = {
      save: jest.fn(),
      create: jest.fn((x: unknown) => x),
      createQueryBuilder: jest.fn(),
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue(typeormRepo),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementRepository,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    repo = module.get(StockMovementRepository);
  });

  it('persists a stock movement via save+create', async () => {
    typeormRepo.save.mockResolvedValue({ id: 'sm-1' });
    const out = await repo.create({
      productId: 'p-1',
      branchId: 'b-1',
      movementType: 'Sale',
      qtyOut: 2,
      balanceAfter: 18,
      createdByUserId: 'u-1',
    });
    expect(out).toEqual({ id: 'sm-1' });
    expect(typeormRepo.create).toHaveBeenCalled();
    expect(typeormRepo.save).toHaveBeenCalled();
  });

  it('orders findByProductId rows by created_at DESC', async () => {
    const rows = [{ id: 'sm-2' }];
    const qb = buildQb(rows);
    typeormRepo.createQueryBuilder.mockReturnValue(qb);

    const out = await repo.findByProductId('p-1');
    expect(out).toBe(rows);
    expect(qb.where).toHaveBeenCalledWith('sm.product_id = :productId', {
      productId: 'p-1',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('sm.created_at', 'DESC');
  });

  it('filters findByRef by (refType, refId)', async () => {
    const rows = [{ id: 'sm-3' }, { id: 'sm-4' }];
    const qb = buildQb(rows);
    typeormRepo.createQueryBuilder.mockReturnValue(qb);

    const out = await repo.findByRef('Sale', 'sale-uuid');
    expect(out).toBe(rows);
    expect(qb.where).toHaveBeenCalledWith('sm.ref_type = :refType', {
      refType: 'Sale',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('sm.ref_id = :refId', {
      refId: 'sale-uuid',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('sm.created_at', 'DESC');
  });

  it('uses the supplied EntityManager when one is passed to create', async () => {
    const managerRepo: FakeRepo = {
      save: jest.fn().mockResolvedValue({ id: 'sm-5' }),
      create: jest.fn((x: unknown) => x),
      createQueryBuilder: jest.fn(),
    };
    const fakeManager = {
      getRepository: jest.fn().mockReturnValue(managerRepo),
    } as unknown as Parameters<StockMovementRepository['create']>[1];

    const out = await repo.create(
      {
        productId: 'p-2',
        branchId: 'b-2',
        movementType: 'Sale_Voided',
        qtyIn: 1,
        balanceAfter: 19,
        createdByUserId: 'u-2',
      },
      fakeManager,
    );

    expect(out).toEqual({ id: 'sm-5' });
    expect(managerRepo.save).toHaveBeenCalled();
    expect(typeormRepo.save).not.toHaveBeenCalled();
  });
});
