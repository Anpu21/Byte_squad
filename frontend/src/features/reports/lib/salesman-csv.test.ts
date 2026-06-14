import { describe, expect, it } from 'vitest';
import { buildSalesmanCsv } from './salesman-csv';

describe('buildSalesmanCsv', () => {
    it('renders a header plus one quoted row per cashier', () => {
        const csv = buildSalesmanCsv([
            {
                cashierId: 'c-1',
                cashierName: 'Frost, Emma',
                salesCount: 3,
                grossTotal: 1000,
                discountTotal: 50.5,
                netTotal: 949.5,
                voidedCount: 1,
            },
        ]);
        const lines = csv.split('\n');
        expect(lines).toHaveLength(2);
        expect(lines[0]).toBe('Cashier,Sales,Gross,Bill discount,Net,Voided');
        expect(lines[1]).toBe('"Frost, Emma",3,1000.00,50.50,949.50,1');
    });

    it('escapes embedded quotes in names', () => {
        const csv = buildSalesmanCsv([
            {
                cashierId: 'c-1',
                cashierName: 'A "B" C',
                salesCount: 0,
                grossTotal: 0,
                discountTotal: 0,
                netTotal: 0,
                voidedCount: 0,
            },
        ]);
        expect(csv.split('\n')[1]).toContain('"A ""B"" C"');
    });
});
