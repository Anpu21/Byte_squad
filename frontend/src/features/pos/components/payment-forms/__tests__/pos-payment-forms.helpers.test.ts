import { describe, it, expect } from 'vitest';
import {
    buildSalePayload,
    createInitialTenderBag,
} from '../pos-payment-forms.helpers';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';

function makeCartItem(overrides: Partial<ICartItem> = {}): ICartItem {
    return {
        rowId: 'row-1',
        productId: 'p1',
        productCode: 'P001',
        productName: 'Test',
        productType: 'GENERIC',
        baseUnit: 'unit',
        unitId: null,
        unitName: 'unit',
        unitPrice: 100,
        conversionFactor: 1,
        quantity: 1,
        free: 0,
        discountPercentage: 0,
        taxRate: 0,
        discountAllowed: true,
        lineSubtotal: 100,
        lineDiscountAmount: 0,
        lineTaxAmount: 0,
        lineTotal: 100,
        baseUnitQty: 1,
        ...overrides,
    };
}

const userOwner: IPosLoyaltyOwner = {
    ownerType: 'user',
    userId: 'user-99',
    loyaltyCustomerId: null,
    firstName: 'Anya',
    pointsBalance: 200,
};

const walkInOwner: IPosLoyaltyOwner = {
    ownerType: 'walkIn',
    userId: null,
    loyaltyCustomerId: 'lc-77',
    firstName: 'Sunil',
    pointsBalance: 50,
};

describe('buildSalePayload — loyalty', () => {
    const cart = [makeCartItem()];
    const bag = createInitialTenderBag(100);

    it('omits all loyalty fields when no owner is attached', () => {
        const payload = buildSalePayload({
            cart,
            cartDiscountPercentage: 0,
            paymentMethod: 'Cash',
            paymentAmount: 100,
            bag,
            cashAmount: 100,
        });
        expect(payload.customerUserId).toBeUndefined();
        expect(payload.loyaltyCustomerId).toBeUndefined();
        expect(payload.loyaltyRedeemPoints).toBeUndefined();
    });

    it('sends customerUserId when the owner is a registered user', () => {
        const payload = buildSalePayload({
            cart,
            cartDiscountPercentage: 0,
            paymentMethod: 'Cash',
            paymentAmount: 100,
            bag,
            cashAmount: 100,
            loyaltyOwner: userOwner,
            loyaltyRedeemPoints: 0,
        });
        expect(payload.customerUserId).toBe('user-99');
        expect(payload.loyaltyCustomerId).toBeUndefined();
        expect(payload.loyaltyRedeemPoints).toBeUndefined();
    });

    it('sends loyaltyCustomerId when the owner is a walk-in', () => {
        const payload = buildSalePayload({
            cart,
            cartDiscountPercentage: 0,
            paymentMethod: 'Cash',
            paymentAmount: 100,
            bag,
            cashAmount: 100,
            loyaltyOwner: walkInOwner,
            loyaltyRedeemPoints: 0,
        });
        expect(payload.loyaltyCustomerId).toBe('lc-77');
        expect(payload.customerUserId).toBeUndefined();
    });

    it('forwards loyaltyRedeemPoints when > 0 and an owner is attached', () => {
        const payload = buildSalePayload({
            cart,
            cartDiscountPercentage: 0,
            paymentMethod: 'Cash',
            paymentAmount: 100,
            bag,
            cashAmount: 100,
            loyaltyOwner: userOwner,
            loyaltyRedeemPoints: 25,
        });
        expect(payload.customerUserId).toBe('user-99');
        expect(payload.loyaltyRedeemPoints).toBe(25);
    });

    it('drops loyaltyRedeemPoints when the value is 0 even if an owner is attached', () => {
        const payload = buildSalePayload({
            cart,
            cartDiscountPercentage: 0,
            paymentMethod: 'Cash',
            paymentAmount: 100,
            bag,
            cashAmount: 100,
            loyaltyOwner: userOwner,
            loyaltyRedeemPoints: 0,
        });
        expect(payload.customerUserId).toBe('user-99');
        expect(payload.loyaltyRedeemPoints).toBeUndefined();
    });

    it('drops loyaltyRedeemPoints when no owner is attached even if > 0', () => {
        const payload = buildSalePayload({
            cart,
            cartDiscountPercentage: 0,
            paymentMethod: 'Cash',
            paymentAmount: 100,
            bag,
            cashAmount: 100,
            loyaltyOwner: null,
            loyaltyRedeemPoints: 50,
        });
        expect(payload.loyaltyRedeemPoints).toBeUndefined();
        expect(payload.customerUserId).toBeUndefined();
        expect(payload.loyaltyCustomerId).toBeUndefined();
    });
});
