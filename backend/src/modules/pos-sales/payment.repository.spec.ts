import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { PaymentRepository } from './payment.repository';
import { Payment } from '@/modules/pos-sales/entities/payment.entity';

interface FakeRepo {
  save: jest.Mock;
  create: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
}

describe('PaymentRepository', () => {
  let repo: PaymentRepository;
  let typeormRepo: FakeRepo;
  let dataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    typeormRepo = {
      save: jest.fn(),
      create: jest.fn((x: unknown) => x),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue(typeormRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRepository,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    repo = module.get(PaymentRepository);
  });

  it('persists a payment via save+create', async () => {
    typeormRepo.save.mockResolvedValue({ id: 'p-1' });
    const out = await repo.create({
      saleId: 's-1',
      paymentMethod: 'Cash',
      paymentAmount: 100,
      invoiceTotal: 100,
      receiptNo: 'RCPT-x',
    });
    expect(out).toEqual({ id: 'p-1' });
    expect(typeormRepo.create).toHaveBeenCalledWith({
      saleId: 's-1',
      paymentMethod: 'Cash',
      paymentAmount: 100,
      invoiceTotal: 100,
      receiptNo: 'RCPT-x',
    });
    expect(typeormRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException when voiding a missing payment', async () => {
    typeormRepo.update.mockResolvedValueOnce({ affected: 0 });
    await expect(repo.voidById('missing')).rejects.toThrow(
      'Payment missing not found',
    );
  });

  it('uses the supplied EntityManager when one is passed to create', async () => {
    const managerRepo: FakeRepo = {
      save: jest.fn().mockResolvedValue({ id: 'p-2' }),
      create: jest.fn((x: unknown) => x),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const fakeManager = {
      getRepository: jest.fn().mockReturnValue(managerRepo),
    } as unknown as Parameters<PaymentRepository['create']>[1];

    const out = await repo.create(
      {
        saleId: 's-3',
        paymentMethod: 'Card',
        paymentAmount: 50,
        invoiceTotal: 50,
        receiptNo: 'RCPT-y',
      },
      fakeManager,
    );

    expect(out).toEqual({ id: 'p-2' });
    expect(managerRepo.save).toHaveBeenCalled();
    expect(managerRepo.create).toHaveBeenCalled();
    // Should not have touched the dataSource-backed repo
    expect(typeormRepo.save).not.toHaveBeenCalled();
  });

  it('looks up a payment by sale id', async () => {
    const dummy: Partial<Payment> = { id: 'p-3', saleId: 's-9' };
    typeormRepo.findOne.mockResolvedValue(dummy);
    const out = await repo.findBySaleId('s-9');
    expect(out).toBe(dummy);
    expect(typeormRepo.findOne).toHaveBeenCalledWith({
      where: { saleId: 's-9' },
    });
  });
});
