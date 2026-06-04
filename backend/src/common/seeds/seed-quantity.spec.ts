import {
  buildSeedSaleLine,
  generateSeedQuantity,
  generateSeedSaleQuantity,
} from './seed-quantity';

function hasAtMostThreeDecimals(value: number): boolean {
  const scaled = value * 1000;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

describe('seed quantity helpers', () => {
  it('generates deterministic UNIT stock as whole numbers', () => {
    const first = generateSeedQuantity('unit', 'healthy', 10, 'BR001:BVG-001');
    const second = generateSeedQuantity('unit', 'healthy', 10, 'BR001:BVG-001');
    expect(first).toBe(second);
    expect(Number.isInteger(first)).toBe(true);
  });

  it('generates KG and L stock with no more than 3 decimals', () => {
    const kg = generateSeedQuantity('kg', 'healthy', 10, 'BR001:PRD-002');
    const l = generateSeedQuantity('l', 'healthy', 10, 'BR001:PNT-007');
    expect(hasAtMostThreeDecimals(kg)).toBe(true);
    expect(hasAtMostThreeDecimals(l)).toBe(true);
  });

  it('keeps short branch quantities deterministic and capable of low/out stock', () => {
    const quantities = Array.from({ length: 80 }, (_, i) =>
      generateSeedQuantity('unit', 'short', 10, `BR003:seed-${i}`),
    );
    expect(quantities.some((quantity) => quantity === 0)).toBe(true);
    expect(quantities.some((quantity) => quantity > 0 && quantity < 10)).toBe(
      true,
    );
  });

  it('generates whole sale quantities for UNIT and decimal sale quantities for KG/L', () => {
    const unitQty = generateSeedSaleQuantity('unit', 'sale:BVG-001');
    const kgQty = generateSeedSaleQuantity('kg', 'sale:PRD-002');
    const lQty = generateSeedSaleQuantity('l', 'sale:PNT-007');

    expect(Number.isInteger(unitQty)).toBe(true);
    expect(hasAtMostThreeDecimals(kgQty)).toBe(true);
    expect(hasAtMostThreeDecimals(lQty)).toBe(true);
  });

  it('builds base-only sale lines where baseUnitQty equals quantity', () => {
    const line = buildSeedSaleLine(
      { baseUnit: 'kg', sellingPrice: 170 },
      'cashier:PRD-002',
    );
    expect(line.baseUnitQty).toBe(line.quantity);
    expect(line.lineTotal).toBe(
      Math.round(line.quantity * line.unitPrice * 100) / 100,
    );
  });
});
