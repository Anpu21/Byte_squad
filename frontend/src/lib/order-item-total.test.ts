import { describe, it, expect } from 'vitest';
import { orderItemLineTotal } from './order-item-total';

describe('orderItemLineTotal', () => {
    it('uses the fixed override for a "buy by amount" line', () => {
        expect(
            orderItemLineTotal({
                unitPriceSnapshot: 170,
                quantity: 5.882,
                fixedPriceOverride: 1000,
            }),
        ).toBe(1000);
    });

    it('falls back to unit price × quantity when there is no override', () => {
        expect(
            orderItemLineTotal({ unitPriceSnapshot: 250, quantity: 2 }),
        ).toBe(500);
        expect(
            orderItemLineTotal({
                unitPriceSnapshot: 250,
                quantity: 2,
                fixedPriceOverride: null,
            }),
        ).toBe(500);
    });

    it('coerces the decimal strings the API returns for numeric columns', () => {
        expect(
            orderItemLineTotal({
                unitPriceSnapshot: '250.00',
                quantity: '2.000',
                fixedPriceOverride: null,
            }),
        ).toBe(500);
        expect(
            orderItemLineTotal({
                unitPriceSnapshot: '170.00',
                quantity: '5.882',
                fixedPriceOverride: '1000.00',
            }),
        ).toBe(1000);
    });
});
