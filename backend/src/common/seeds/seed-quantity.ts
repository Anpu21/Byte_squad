import {
  isSupportedBaseUnit,
  type TSupportedBaseUnit,
} from '@products/lib/supported-base-units';

export type SeedStockProfile = 'healthy' | 'short';

export interface SeedSaleProduct {
  baseUnit: string;
  sellingPrice: number | string;
}

export interface SeedSaleLine {
  quantity: number;
  baseUnitQty: number;
  unitPrice: number;
  lineTotal: number;
}

function stableHash(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableRatio(seed: string): number {
  return stableHash(seed) / 0xffffffff;
}

export function stableInt(seed: string, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(stableRatio(seed) * (max - min + 1));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function decimalBetween(seed: string, min: number, max: number): number {
  const whole = stableInt(`${seed}:whole`, min, max);
  const fraction = stableInt(`${seed}:fraction`, 1, 999) / 1000;
  return round3(whole + fraction);
}

function lowQuantity(
  baseUnit: TSupportedBaseUnit,
  threshold: number,
  seed: string,
): number {
  if (threshold <= 1) return 0;
  if (baseUnit === 'unit') {
    return stableInt(`${seed}:low`, 0, threshold - 1);
  }
  const maxMillis = threshold * 1000 - 1;
  return round3(stableInt(`${seed}:low`, 1, maxMillis) / 1000);
}

function highQuantity(
  baseUnit: TSupportedBaseUnit,
  threshold: number,
  seed: string,
): number {
  if (baseUnit === 'unit') {
    return stableInt(`${seed}:high`, threshold, threshold + 149);
  }
  return decimalBetween(`${seed}:high`, threshold, threshold + 149);
}

function supportedBaseUnit(value: string): TSupportedBaseUnit {
  return isSupportedBaseUnit(value) ? value : 'unit';
}

export function generateSeedQuantity(
  baseUnit: string,
  profile: SeedStockProfile,
  threshold: number,
  seed: string,
): number {
  const unit = supportedBaseUnit(baseUnit);
  const ratio = stableRatio(`${seed}:${profile}`);
  if (profile === 'short') {
    if (ratio < 0.2) return 0;
    if (ratio < 0.55) return lowQuantity(unit, threshold, seed);
    return highQuantity(unit, threshold, seed);
  }
  if (ratio < 0.05) return 0;
  if (ratio < 0.18) return lowQuantity(unit, threshold, seed);
  return highQuantity(unit, threshold, seed);
}

export function generateSeedSaleQuantity(
  baseUnit: string,
  seed: string,
): number {
  const unit = supportedBaseUnit(baseUnit);
  if (unit === 'unit') {
    return stableInt(`${seed}:sale`, 1, 3);
  }
  const steps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  return steps[stableInt(`${seed}:sale`, 0, steps.length - 1)];
}

export function buildSeedSaleLine(
  product: SeedSaleProduct,
  seed: string,
): SeedSaleLine {
  const quantity = generateSeedSaleQuantity(product.baseUnit, seed);
  const unitPrice = Number(product.sellingPrice);
  const lineTotal = round2(unitPrice * quantity);
  return {
    quantity,
    baseUnitQty: quantity,
    unitPrice,
    lineTotal,
  };
}
