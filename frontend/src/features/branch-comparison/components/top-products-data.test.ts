import { describe, it, expect } from 'vitest';
import { flattenRows, type ProductCardData } from './top-products-data';

const colorFor = (branchId: string) => `color-${branchId}`;

function product(over: Partial<ProductCardData> = {}): ProductCardData {
    return {
        productId: 'p1',
        productName: 'Rice',
        totalRevenue: 300,
        maxRevenue: 200,
        leaderBranchId: 'b2',
        cells: [
            { branchId: 'b1', branchName: 'Downtown', revenue: 100, quantity: 10 },
            { branchId: 'b2', branchName: 'Main', revenue: 200, quantity: 20 },
        ],
        ...over,
    };
}

describe('flattenRows', () => {
    it('emits one row per product-branch, leader first, with flag + colour', () => {
        const rows = flattenRows([product()], colorFor);
        expect(rows).toHaveLength(2);
        // revenue desc within the product → leader (b2) first
        expect(rows.map((r) => r.branchId)).toEqual(['b2', 'b1']);
        expect(rows[0]).toMatchObject({
            branchId: 'b2',
            isLeader: true,
            color: 'color-b2',
            revenue: 200,
        });
        expect(rows[1]).toMatchObject({
            branchId: 'b1',
            isLeader: false,
            quantity: 10,
        });
    });

    it('preserves product order across multiple products', () => {
        const rows = flattenRows(
            [
                product({ productId: 'p1' }),
                product({ productId: 'p2', productName: 'Oil' }),
            ],
            colorFor,
        );
        expect(rows.map((r) => r.productId)).toEqual(['p1', 'p1', 'p2', 'p2']);
    });

    it('marks no leader when leaderBranchId is null', () => {
        const rows = flattenRows(
            [product({ leaderBranchId: null })],
            colorFor,
        );
        expect(rows.every((r) => !r.isLeader)).toBe(true);
    });
});
