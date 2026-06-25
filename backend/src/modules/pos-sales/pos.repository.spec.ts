import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PosRepository } from '@/modules/pos-sales/pos.repository';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { SaleItem } from '@/modules/pos-sales/entities/sale-item.entity';
import { IdempotencyKey } from '@/modules/pos-sales/entities/idempotency-key.entity';

describe('PosRepository.findTransactionById', () => {
  let repo: PosRepository;
  let transactionRepoMock: { findOne: jest.Mock };

  beforeEach(async () => {
    transactionRepoMock = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PosRepository,
        { provide: getRepositoryToken(Sale), useValue: transactionRepoMock },
        { provide: getRepositoryToken(SaleItem), useValue: {} },
        { provide: getRepositoryToken(IdempotencyKey), useValue: {} },
      ],
    }).compile();

    repo = moduleRef.get(PosRepository);
  });

  it('eager-loads items.product and items.unit so the FE receipt can render the unit suffix', async () => {
    const dummy: Partial<Sale> = { id: 'sale-1' };
    transactionRepoMock.findOne.mockResolvedValue(dummy);

    const out = await repo.findTransactionById('sale-1');

    expect(out).toBe(dummy);
    expect(transactionRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 'sale-1' },
      relations: ['items', 'items.product', 'items.unit', 'cashier'],
    });
  });
});
