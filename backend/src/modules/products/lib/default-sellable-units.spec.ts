import { defaultSellableUnitsFor } from './default-sellable-units';

describe('defaultSellableUnitsFor', () => {
  const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';

  it.each(['kg', 'l', 'unit'] as const)(
    'returns one priced base row for %s products',
    (baseUnit) => {
      const rows = defaultSellableUnitsFor(PRODUCT_ID, baseUnit, 400);
      expect(rows).toEqual([
        {
          productId: PRODUCT_ID,
          name: baseUnit,
          barcode: null,
          isBase: true,
          conversionToBase: 1,
          sellingPrice: 400,
          displayOrder: 0,
        },
      ]);
    },
  );

  it('falls back to a self-mirror row for unknown base units', () => {
    const rows = defaultSellableUnitsFor(PRODUCT_ID, 'dozen', 650);
    expect(rows).toEqual([
      {
        productId: PRODUCT_ID,
        name: 'dozen',
        barcode: null,
        isBase: true,
        conversionToBase: 1,
        sellingPrice: 650,
        displayOrder: 0,
      },
    ]);
  });

  it('is case-insensitive for supported base units', () => {
    const upper = defaultSellableUnitsFor(PRODUCT_ID, 'KG', 100);
    const lower = defaultSellableUnitsFor(PRODUCT_ID, 'kg', 100);
    expect(upper).toEqual(lower);
  });
});
