import { BadRequestException } from '@nestjs/common';
import { validateSellableUnits } from './validate-sellable-units';
import type { SellableUnitDto } from '@products/dto/sellable-unit.dto';

const validKg: SellableUnitDto = {
  name: 'kg',
  barcode: null,
  isBase: true,
  conversionToBase: 1,
  sellingPrice: 400,
  displayOrder: 0,
};
const validG: SellableUnitDto = {
  name: '12-PACK',
  barcode: 'EGG-12',
  isBase: false,
  conversionToBase: 12,
  sellingPrice: 650,
  displayOrder: 1,
};

describe('validateSellableUnits', () => {
  it('throws when rows is empty', () => {
    expect(() => validateSellableUnits([])).toThrow(BadRequestException);
  });

  it('throws when no row is marked as base', () => {
    expect(() => validateSellableUnits([{ ...validG }])).toThrow(
      /exactly one/i,
    );
  });

  it('throws when more than one row is marked as base', () => {
    expect(() =>
      validateSellableUnits([
        { ...validKg },
        {
          name: 'unit',
          barcode: null,
          isBase: true,
          conversionToBase: 1,
          sellingPrice: 10,
          displayOrder: 1,
        },
      ]),
    ).toThrow(/exactly one/i);
  });

  it('throws when the base row has conversionToBase !== 1', () => {
    expect(() =>
      validateSellableUnits([{ ...validKg, conversionToBase: 0.5 }]),
    ).toThrow(/conversion/i);
  });

  it('throws on duplicate unit names (case-insensitive)', () => {
    expect(() =>
      validateSellableUnits([
        { ...validKg },
        {
          name: 'KG',
          barcode: null,
          isBase: false,
          conversionToBase: 1,
          sellingPrice: 10,
          displayOrder: 1,
        },
      ]),
    ).toThrow(/duplicate/i);
  });

  it('returns the rows unchanged for a valid base + pack pair', () => {
    const rows = [validKg, validG];
    expect(validateSellableUnits(rows)).toBe(rows);
  });

  it('accepts a single UNIT base row', () => {
    const rows: SellableUnitDto[] = [
      {
        name: 'unit',
        barcode: null,
        isBase: true,
        conversionToBase: 1,
        sellingPrice: 60,
        displayOrder: 0,
      },
    ];
    expect(validateSellableUnits(rows)).toBe(rows);
  });

  it('throws on duplicate unit barcodes', () => {
    expect(() =>
      validateSellableUnits([
        { ...validKg },
        { ...validG },
        {
          name: '6-PACK',
          barcode: 'egg-12',
          isBase: false,
          conversionToBase: 6,
          sellingPrice: 330,
          displayOrder: 2,
        },
      ]),
    ).toThrow(/duplicate unit barcode/i);
  });
});
