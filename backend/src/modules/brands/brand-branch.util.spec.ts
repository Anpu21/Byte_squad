import {
  assembleBrandBranchRows,
  assembleBrandBranchProductRows,
  type BrandRosterEntry,
  type BrandBranchBreakdownEntry,
} from '@/modules/brands/brand-branch.util';

const BRANCHES = ['br-1', 'br-2', 'br-3'];

function rosterEntry(over: Partial<BrandRosterEntry> = {}): BrandRosterEntry {
  return {
    brandId: 'b1',
    brandName: 'Prima',
    color: '#6366f1',
    units: 10,
    revenue: 1000,
    profit: 200,
    transactions: 4,
    ...over,
  };
}

describe('assembleBrandBranchRows', () => {
  it('emits every selected branch per row, in branchIds order, zero-filling gaps', () => {
    const breakdown: BrandBranchBreakdownEntry[] = [
      { brandId: 'b1', branchId: 'br-3', units: 6, revenue: 600, profit: 120 },
      { brandId: 'b1', branchId: 'br-1', units: 4, revenue: 400, profit: 80 },
    ];
    const [row] = assembleBrandBranchRows([rosterEntry()], breakdown, BRANCHES);

    expect(row.perBranch.map((c) => c.branchId)).toEqual(BRANCHES);
    expect(row.perBranch[0]).toEqual({
      branchId: 'br-1',
      revenue: 400,
      units: 4,
      profit: 80,
    });
    // br-2 never sold this brand — a genuine zero cell, not a dropped column.
    expect(row.perBranch[1]).toEqual({
      branchId: 'br-2',
      revenue: 0,
      units: 0,
      profit: 0,
    });
    expect(row.perBranch[2].revenue).toBe(600);
  });

  it('keeps the Unbranded bucket (brandId null) apart from real brands', () => {
    const roster = [
      rosterEntry(),
      rosterEntry({ brandId: null, brandName: 'Unbranded', color: null }),
    ];
    const breakdown: BrandBranchBreakdownEntry[] = [
      { brandId: 'b1', branchId: 'br-1', units: 4, revenue: 400, profit: 80 },
      { brandId: null, branchId: 'br-1', units: 9, revenue: 900, profit: 90 },
    ];
    const [prima, unbranded] = assembleBrandBranchRows(
      roster,
      breakdown,
      BRANCHES,
    );

    expect(prima.perBranch[0].revenue).toBe(400);
    expect(unbranded.brandId).toBeNull();
    expect(unbranded.perBranch[0].revenue).toBe(900);
    expect(unbranded.perBranch[1].revenue).toBe(0);
  });

  it('passes roster totals through and leaves margin/share as placeholders', () => {
    const [row] = assembleBrandBranchRows([rosterEntry()], [], BRANCHES);
    expect(row.revenue).toBe(1000);
    expect(row.transactions).toBe(4);
    expect(row.marginPct).toBe(0);
    expect(row.sharePct).toBe(0);
  });
});

describe('assembleBrandBranchProductRows', () => {
  it('zero-fills each product row across the selected branches', () => {
    const rows = assembleBrandBranchProductRows(
      [
        {
          productId: 'p1',
          productName: 'White Bread',
          units: 5,
          revenue: 500,
          profit: 50,
        },
      ],
      [{ productId: 'p1', branchId: 'br-2', units: 5, revenue: 500, profit: 50 }],
      BRANCHES,
    );

    expect(rows[0].perBranch.map((c) => c.branchId)).toEqual(BRANCHES);
    expect(rows[0].perBranch[0].revenue).toBe(0);
    expect(rows[0].perBranch[1].revenue).toBe(500);
    expect(rows[0].perBranch[2].units).toBe(0);
  });

  it('does not leak one product’s cells into another', () => {
    const rows = assembleBrandBranchProductRows(
      [
        { productId: 'p1', productName: 'A', units: 1, revenue: 100, profit: 10 },
        { productId: 'p2', productName: 'B', units: 2, revenue: 200, profit: 20 },
      ],
      [
        { productId: 'p2', branchId: 'br-1', units: 2, revenue: 200, profit: 20 },
      ],
      ['br-1'],
    );

    expect(rows[0].perBranch[0].revenue).toBe(0);
    expect(rows[1].perBranch[0].revenue).toBe(200);
  });
});
