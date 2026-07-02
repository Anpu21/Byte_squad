import {
  assembleProductRows,
  type ProductBranchBreakdown,
  type ProductRosterEntry,
} from './products-roster.util';

const roster: ProductRosterEntry[] = [
  {
    productId: 'p1',
    productName: 'Bananas',
    totalRevenue: 22250,
    totalQuantity: 300,
  },
  {
    productId: 'p2',
    productName: 'Milk 1L',
    totalRevenue: 19500,
    totalQuantity: 150,
  },
];

describe('assembleProductRows', () => {
  it('zero-fills a branch with no row for a product (present, not dropped)', () => {
    const breakdown: ProductBranchBreakdown[] = [
      { productId: 'p1', branchId: 'A', revenue: 12400, quantity: 160 },
      // p1 deliberately has NO row for branch B
      { productId: 'p2', branchId: 'A', revenue: 8200, quantity: 60 },
      { productId: 'p2', branchId: 'B', revenue: 11300, quantity: 90 },
    ];
    const rows = assembleProductRows(roster, breakdown, ['A', 'B']);
    const bananas = rows.find((r) => r.productId === 'p1')!;
    expect(bananas.perBranch).toEqual([
      { branchId: 'A', revenue: 12400, quantity: 160 },
      { branchId: 'B', revenue: 0, quantity: 0 },
    ]);
  });

  it('orders perBranch to match the branchIds order', () => {
    const breakdown: ProductBranchBreakdown[] = [
      { productId: 'p1', branchId: 'B', revenue: 5, quantity: 1 },
      { productId: 'p1', branchId: 'A', revenue: 10, quantity: 2 },
    ];
    const rows = assembleProductRows([roster[0]], breakdown, ['A', 'B']);
    expect(rows[0].perBranch.map((c) => c.branchId)).toEqual(['A', 'B']);
    expect(rows[0].perBranch[0].revenue).toBe(10);
  });

  it('preserves roster order, carries totals, and zero-fills with no breakdown', () => {
    const rows = assembleProductRows(roster, [], ['A']);
    expect(rows.map((r) => r.productId)).toEqual(['p1', 'p2']);
    expect(rows[0].totalRevenue).toBe(22250);
    expect(rows[0].totalQuantity).toBe(300);
    expect(rows[0].perBranch).toEqual([
      { branchId: 'A', revenue: 0, quantity: 0 },
    ]);
  });
});
