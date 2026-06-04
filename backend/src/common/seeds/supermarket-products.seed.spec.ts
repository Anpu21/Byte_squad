import { SUPPORTED_BASE_UNITS } from '@products/lib/supported-base-units';
import { SUPERMARKET_PRODUCTS } from './supermarket-products.seed';

function productByBarcode(barcode: string) {
  const product = SUPERMARKET_PRODUCTS.find((p) => p.barcode === barcode);
  if (!product) {
    throw new Error(`Missing seed product ${barcode}`);
  }
  return product;
}

describe('SUPERMARKET_PRODUCTS', () => {
  it('uses only the supported KG/L/UNIT base units', () => {
    const supported = new Set<string>(SUPPORTED_BASE_UNITS);
    expect(SUPERMARKET_PRODUCTS).toHaveLength(
      new Set(SUPERMARKET_PRODUCTS.map((p) => p.barcode)).size,
    );
    expect(SUPERMARKET_PRODUCTS.every((p) => supported.has(p.baseUnit))).toBe(
      true,
    );
  });

  it('does not seed legacy base units', () => {
    const legacy = new Set(['g', 'ml', 'each', 'pack', 'box', 'bottle']);
    expect(SUPERMARKET_PRODUCTS.some((p) => legacy.has(p.baseUnit))).toBe(
      false,
    );
  });

  it('keeps demo coverage for KG, L, and UNIT products', () => {
    const units = new Set(SUPERMARKET_PRODUCTS.map((p) => p.baseUnit));
    expect(units).toEqual(new Set(['kg', 'l', 'unit']));
  });

  it('keeps fixed-size packaged goods as UNIT stock', () => {
    const packagedBarcodes = [
      'BVG-001',
      'BVG-007',
      'DRY-001',
      'PNT-001',
      'PNT-005',
      'SNK-003',
      'FRZ-003',
      'HSH-001',
      'PCR-003',
    ];
    for (const barcode of packagedBarcodes) {
      expect(productByBarcode(barcode).baseUnit).toBe('unit');
    }
  });

  it('keeps loose weighted and loose liquid demo products on KG/L', () => {
    expect(productByBarcode('PRD-002')).toMatchObject({
      name: 'Bananas',
      baseUnit: 'kg',
    });
    expect(productByBarcode('PNT-007')).toMatchObject({
      name: 'Loose Sunflower Oil',
      baseUnit: 'l',
    });
  });
});
