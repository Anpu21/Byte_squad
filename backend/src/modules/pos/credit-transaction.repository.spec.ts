/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CreditTransactionRepository } from './credit-transaction.repository';

interface FakeRepo {
  save: jest.Mock;
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
}

interface FakeQb {
  where: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
}

function buildQb(rows: unknown[]): FakeQb {
  const qb: FakeQb = {
    where: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn().mockResolvedValue(rows),
  };
  qb.where.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  return qb;
}

describe('CreditTransactionRepository', () => {
  let repo: CreditTransactionRepository;
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
        CreditTransactionRepository,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    repo = module.get(CreditTransactionRepository);
  });

  it('persists a credit transaction via save+create', async () => {
    typeormRepo.save.mockResolvedValue({ id: 'ct-1' });
    const out = await repo.create({
      userId: 'u-1',
      transactionType: 'Credit_Taken',
      amount: 100,
      runningBalance: 100,
      referenceNo: 'REF-1',
    });
    expect(out).toEqual({ id: 'ct-1' });
    expect(typeormRepo.create).toHaveBeenCalled();
    expect(typeormRepo.save).toHaveBeenCalled();
  });

  it('orders findByUserId rows by created_at DESC', async () => {
    const rows = [{ id: 'ct-2' }, { id: 'ct-3' }];
    const qb = buildQb(rows);
    typeormRepo.createQueryBuilder.mockReturnValue(qb);

    const out = await repo.findByUserId('u-1');
    expect(out).toBe(rows);
    expect(typeormRepo.createQueryBuilder).toHaveBeenCalledWith('ct');
    expect(qb.where).toHaveBeenCalledWith('ct.user_id = :userId', {
      userId: 'u-1',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('ct.created_at', 'DESC');
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('uses the supplied EntityManager when one is passed to create', async () => {
    const managerRepo: FakeRepo = {
      save: jest.fn().mockResolvedValue({ id: 'ct-4' }),
      create: jest.fn((x: unknown) => x),
      createQueryBuilder: jest.fn(),
    };
    const fakeManager = {
      getRepository: jest.fn().mockReturnValue(managerRepo),
    } as unknown as Parameters<CreditTransactionRepository['create']>[1];

    const out = await repo.create(
      {
        userId: 'u-2',
        transactionType: 'Credit_Paid',
        amount: 25,
        runningBalance: 0,
        referenceNo: 'REF-2',
      },
      fakeManager,
    );

    expect(out).toEqual({ id: 'ct-4' });
    expect(managerRepo.save).toHaveBeenCalled();
    expect(typeormRepo.save).not.toHaveBeenCalled();
  });
});
