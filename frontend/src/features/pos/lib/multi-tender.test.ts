import { describe, it, expect } from 'vitest';
import {
    calculateMultiTender,
    tryCalculateMultiTender,
    MULTI_TENDER_OVERPAY_ERROR,
    type IMultiTenderInputs,
} from './multi-tender';

/**
 * Mirrors `backend/src/modules/pos/services/multi-tender-calculator.service.spec.ts`.
 * Same seven cases — if the backend rules ever change, both specs must move
 * in lockstep.
 */
function inputs(
    overrides: Partial<IMultiTenderInputs>,
): IMultiTenderInputs {
    return {
        invoiceTotal: 100,
        cashAmount: 0,
        cashTendered: 0,
        chequeAmount: 0,
        bankTransferAmount: 0,
        creditAmount: 0,
        keepBalance: false,
        ...overrides,
    };
}

describe('calculateMultiTender', () => {
    it('full cash payment: Paid, no balance, no change', () => {
        const result = calculateMultiTender(
            inputs({ cashAmount: 100, cashTendered: 100 }),
        );

        expect(result.paymentStatus).toBe('Paid');
        expect(result.balanceDue).toBe(0);
        expect(result.cashChange).toBe(0);
        expect(result.paymentAmount).toBe(100);
        expect(result.paidAmount).toBe(100);
        expect(result.creditTaken).toBe(0);
        expect(result.overpayKeptBalance).toBe(0);
    });

    it('cash with overpay tender returns change', () => {
        const result = calculateMultiTender(
            inputs({ cashAmount: 100, cashTendered: 150 }),
        );

        expect(result.cashChange).toBe(50);
        expect(result.paymentStatus).toBe('Paid');
        expect(result.paymentAmount).toBe(100);
    });

    it('split cash + cheque: Paid, no balance, paymentAmount=sum', () => {
        const result = calculateMultiTender(
            inputs({
                cashAmount: 60,
                cashTendered: 60,
                chequeAmount: 40,
            }),
        );

        expect(result.paymentStatus).toBe('Paid');
        expect(result.paymentAmount).toBe(100);
        expect(result.balanceDue).toBe(0);
        expect(result.cashChange).toBe(0);
    });

    it('partial cash: Partially_Paid with balanceDue', () => {
        const result = calculateMultiTender(
            inputs({ cashAmount: 70, cashTendered: 70 }),
        );

        expect(result.paymentStatus).toBe('Partially_Paid');
        expect(result.balanceDue).toBe(30);
        expect(result.paidAmount).toBe(70);
        expect(result.paymentAmount).toBe(70);
    });

    it('full credit: counted as Paid; creditTaken records the AR', () => {
        const result = calculateMultiTender(
            inputs({ creditAmount: 100 }),
        );

        expect(result.paymentStatus).toBe('Paid');
        expect(result.creditTaken).toBe(100);
        expect(result.balanceDue).toBe(0);
        expect(result.paidAmount).toBe(100);
    });

    it('keep-balance overpayment: kept as customer credit, paidAmount capped at invoice', () => {
        const result = calculateMultiTender(
            inputs({
                cashAmount: 120,
                cashTendered: 120,
                keepBalance: true,
            }),
        );

        expect(result.overpayKeptBalance).toBe(20);
        expect(result.paidAmount).toBe(100);
        expect(result.paymentStatus).toBe('Paid');
        expect(result.balanceDue).toBe(0);
    });

    it('overpay without keep-balance flag throws', () => {
        expect(() =>
            calculateMultiTender(
                inputs({ cashAmount: 120, cashTendered: 120 }),
            ),
        ).toThrow(MULTI_TENDER_OVERPAY_ERROR);
    });

    it('tryCalculateMultiTender returns null on invalid overpay (no throw)', () => {
        const result = tryCalculateMultiTender(
            inputs({ cashAmount: 120, cashTendered: 120 }),
        );
        expect(result).toBeNull();
    });
});
