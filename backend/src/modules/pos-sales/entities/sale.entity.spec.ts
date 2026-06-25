import { Sale } from './sale.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';

describe('Sale entity', () => {
  it('exposes the same scalar columns as the old Transaction entity', () => {
    // Use Object.assign with explicit return-type annotation so CI's stricter
    // type inference narrows the value to Sale instead of treating field
    // assignments on `new Sale()` as `any` (no-unsafe-member-access).
    const sale: Sale = Object.assign(new Sale(), {
      id: '00000000-0000-0000-0000-000000000000',
      transactionNumber: 'TXN-1-abc',
      branchId: '11111111-1111-1111-1111-111111111111',
      cashierId: '22222222-2222-2222-2222-222222222222',
      type: TransactionType.SALE,
      subtotal: 100,
      discountAmount: 0,
      discountType: DiscountType.NONE,
      taxAmount: 0,
      total: 100,
      paymentMethod: PaymentMethod.CASH,
    });

    expect(sale.transactionNumber).toBe('TXN-1-abc');
    expect(sale.total).toBe(100);
    expect(sale.type).toBe(TransactionType.SALE);
  });

  it('exposes Shanel-port columns (DB-side defaults applied at insert)', () => {
    // The Shanel-required column accessors must compile and accept the
    // literal-union values; the actual NOT NULL defaults are enforced by the
    // ExtendSaleForShanelPort migration so existing rows survive.
    const sale: Sale = Object.assign(new Sale(), {
      saleType: 'Retail',
      priceLevel: 'Wholesale',
      discountPercentage: 10,
      taxRate: 8,
      paidAmount: 0,
      balanceDue: 100,
      paymentStatus: 'Partially_Paid',
      status: 'Active',
      location: 'Shop',
      customerUserId: null,
      voidedReason: null,
      voidedAt: null,
      voidedByUserId: null,
    });

    expect(sale.saleType).toBe('Retail');
    expect(sale.priceLevel).toBe('Wholesale');
    expect(sale.paymentStatus).toBe('Partially_Paid');
    expect(sale.status).toBe('Active');
  });
});
