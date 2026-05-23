import { Sale } from './sale.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';

describe('Sale entity', () => {
  it('exposes the same scalar columns as the old Transaction entity', () => {
    const sale = new Sale();
    sale.id = '00000000-0000-0000-0000-000000000000';
    sale.transactionNumber = 'TXN-1-abc';
    sale.branchId = '11111111-1111-1111-1111-111111111111';
    sale.cashierId = '22222222-2222-2222-2222-222222222222';
    sale.type = TransactionType.SALE;
    sale.subtotal = 100;
    sale.discountAmount = 0;
    sale.discountType = DiscountType.NONE;
    sale.taxAmount = 0;
    sale.total = 100;
    sale.paymentMethod = PaymentMethod.CASH;

    expect(sale.transactionNumber).toBe('TXN-1-abc');
    expect(sale.total).toBe(100);
    expect(sale.type).toBe(TransactionType.SALE);
  });
});
