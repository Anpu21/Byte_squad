import { defaultSellableUnitsFor } from './default-sellable-units';

describe('defaultSellableUnitsFor', () => {
  const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';

  it('returns kg + g pair for a kg-based product, base first', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'kg');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: 'kg',
      isBase: true,
      conversionToBase: 1,
      displayOrder: 0,
      productId: PRODUCT_ID,
    });
    expect(rows[1]).toMatchObject({
      name: 'g',
      isBase: false,
      conversionToBase: 0.001,
      displayOrder: 1,
      productId: PRODUCT_ID,
    });
  });

  it('returns g + kg pair for a g-based product, with kg conversion 1000', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'g');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: 'g',
      isBase: true,
      conversionToBase: 1,
    });
    expect(rows[1]).toMatchObject({
      name: 'kg',
      isBase: false,
      conversionToBase: 1000,
    });
  });

  it('returns l + ml pair for an l-based product, parallel to kg/g', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'l');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: 'l',
      isBase: true,
      conversionToBase: 1,
    });
    expect(rows[1]).toMatchObject({
      name: 'ml',
      isBase: false,
      conversionToBase: 0.001,
    });
  });

  it('returns ml + l pair for an ml-based product, with l conversion 1000', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'ml');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: 'ml',
      isBase: true,
      conversionToBase: 1,
    });
    expect(rows[1]).toMatchObject({
      name: 'l',
      isBase: false,
      conversionToBase: 1000,
    });
  });

  it('returns only a self-mirror row for discrete "each"', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'each');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'each',
      isBase: true,
      conversionToBase: 1,
      displayOrder: 0,
    });
  });

  it('returns a single self-mirror row for "bottle", "pack", "box"', () => {
    for (const baseUnit of ['bottle', 'pack', 'box']) {
      const rows = defaultSellableUnitsFor(PRODUCT_ID, baseUnit);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        name: baseUnit,
        isBase: true,
        conversionToBase: 1,
      });
    }
  });

  it('falls back to a self-mirror row for unknown base units like "dozen"', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'dozen');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'dozen',
      isBase: true,
      conversionToBase: 1,
      displayOrder: 0,
      productId: PRODUCT_ID,
    });
  });

  it('is case-insensitive: "KG" returns the same as "kg"', () => {
    const upper = defaultSellableUnitsFor(PRODUCT_ID, 'KG');
    const lower = defaultSellableUnitsFor(PRODUCT_ID, 'kg');
    expect(upper).toEqual(lower);
  });

  it('stamps the supplied productId on every returned row', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'kg');
    for (const r of rows) {
      expect(r.productId).toBe(PRODUCT_ID);
    }
  });
});
