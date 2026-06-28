import { describe, it, expect } from 'vitest';
import {
  buildSalePayload,
  createInitialTenderBag,
  resolveTenderInputs,
  type ITenderBag,
} from './pos-payment-forms.helpers';
import { calculateMultiTender } from '@/features/pos/lib/multi-tender';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';

const cart = [
  {
    productId: 'p-1',
    quantity: 2,
    free: 0,
    unitPrice: 500,
    discountPercentage: 0,
    taxRate: 0,
  },
] as unknown as ICartItem[];

const loyaltyOwner: IPosLoyaltyOwner = {
  ownerType: 'user',
  userId: 'u-1',
  loyaltyCustomerId: null,
  tier: 'bronze',
  firstName: 'Asha',
  pointsBalance: 0,
};

function creditBag(amount: number): ITenderBag {
  return { ...createInitialTenderBag(amount), creditAmount: amount };
}

describe('resolveTenderInputs — Credit', () => {
  it('routes the whole invoice to creditAmount, not cash', () => {
    const inputs = resolveTenderInputs('Credit', creditBag(1000), 1000);
    expect(inputs.creditAmount).toBe(1000);
    expect(inputs.cashAmount).toBe(0);

    const calc = calculateMultiTender(inputs);
    expect(calc.paymentStatus).toBe('Paid');
    expect(calc.creditTaken).toBe(1000);
    expect(calc.balanceDue).toBe(0);
  });
});

describe('buildSalePayload — Credit', () => {
  it('sends creditAccountId + payment.creditAmount and omits the loyalty owner', () => {
    const payload = buildSalePayload({
      cart,
      cartDiscountPercentage: 0,
      paymentMethod: 'Credit',
      paymentAmount: 1000,
      bag: creditBag(1000),
      cashAmount: 0,
      loyaltyOwner,
      loyaltyRedeemPoints: 0,
      creditAccountId: 'acc-1',
      creditOverrideToken: null,
    });

    expect(payload.creditAccountId).toBe('acc-1');
    expect(payload.payment.paymentMethod).toBe('Credit');
    expect(payload.payment.creditAmount).toBe(1000);
    // The khata is the payer — no loyalty owner, so no BE 400 conflict.
    expect(payload.customerUserId).toBeUndefined();
    expect(payload.loyaltyCustomerId).toBeUndefined();
    expect(payload.creditOverrideToken).toBeUndefined();
  });

  it('includes the manager override token when one is supplied', () => {
    const payload = buildSalePayload({
      cart,
      cartDiscountPercentage: 0,
      paymentMethod: 'Credit',
      paymentAmount: 1000,
      bag: creditBag(1000),
      cashAmount: 0,
      creditAccountId: 'acc-1',
      creditOverrideToken: 'tok-123',
    });
    expect(payload.creditOverrideToken).toBe('tok-123');
  });

  it('falls back to loyalty fields for a cash sale', () => {
    const payload = buildSalePayload({
      cart,
      cartDiscountPercentage: 0,
      paymentMethod: 'Cash',
      paymentAmount: 1000,
      bag: { ...createInitialTenderBag(1000), cashTendered: 1000 },
      cashAmount: 1000,
      loyaltyOwner,
      loyaltyRedeemPoints: 0,
      creditAccountId: null,
      creditOverrideToken: null,
    });
    expect(payload.customerUserId).toBe('u-1');
    expect(payload.creditAccountId).toBeUndefined();
    expect(payload.payment.cashAmount).toBe(1000);
  });
});
