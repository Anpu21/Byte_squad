import { BadRequestException } from '@nestjs/common';
import { validateSellableUnits } from './validate-sellable-units';
import type { SellableUnitDto } from '@products/dto/sellable-unit.dto';

const validKg: SellableUnitDto = {
  name: 'kg',
  isBase: true,
  conversionToBase: 1,
  displayOrder: 0,
};
const validG: SellableUnitDto = {
  name: 'g',
  isBase: false,
  conversionToBase: 0.001,
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
        { name: 'g', isBase: true, conversionToBase: 1, displayOrder: 1 },
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
        { name: 'KG', isBase: false, conversionToBase: 1, displayOrder: 1 },
      ]),
    ).toThrow(/duplicate/i);
  });

  it('returns the rows unchanged for a valid kg + g pair', () => {
    const rows = [validKg, validG];
    expect(validateSellableUnits(rows)).toBe(rows);
  });

  it('accepts a single base row (discrete unit like "each")', () => {
    const rows: SellableUnitDto[] = [
      { name: 'each', isBase: true, conversionToBase: 1, displayOrder: 0 },
    ];
    expect(validateSellableUnits(rows)).toBe(rows);
  });
});
