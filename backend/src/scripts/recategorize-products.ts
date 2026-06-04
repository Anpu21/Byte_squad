/**
 * Bulk re-categorization CLI: rewrite `baseUnit` on existing products
 * from a CSV, one row per product (matched by barcode).
 *
 * Earlier versions of the product form didn't expose the baseUnit choice,
 * so legacy rows landed with `each` regardless of their physical nature
 * (kg-priced produce, l-priced liquids, etc.). This script lets ops
 * retroactively fix those rows in bulk — it just drives
 * `ProductsService.update` per row, which (since Phase BE-3) re-seeds
 * `sellableUnits` whenever `baseUnit` changes.
 *
 * CSV shape (header required):
 *   barcode,newBaseUnit
 *   8901234567890,kg
 *   8907654321098,l
 *
 * Usage:
 *   pnpm script:recategorize-products --csv=/tmp/recat.csv
 *
 * Per-row failures (unknown barcode, unsupported baseUnit, validation
 * error in `update`) are logged with `[skip]`/`[fail]` and counted, but
 * never abort the batch. CLI/CSV errors (missing arg, missing file,
 * malformed rows) exit non-zero via the top-level catch.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import { AppModule } from '@/app.module.js';
import { ProductsService } from '@products/products.service';
import { isSupportedBaseUnit } from '@products/lib/supported-base-units';

interface CsvRow {
  barcode: string;
  newBaseUnit: string;
}

interface CliArgs {
  csvPath: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const csvArg = argv.find((a) => a.startsWith('--csv='));
  if (!csvArg) {
    throw new Error('Usage: pnpm script:recategorize-products --csv=<path>');
  }
  const csvPath = csvArg.slice('--csv='.length);
  if (!csvPath) {
    throw new Error('Usage: pnpm script:recategorize-products --csv=<path>');
  }
  return { csvPath };
}

function loadRows(csvPath: string): CsvRow[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  for (const row of rows) {
    if (!row.barcode || !row.newBaseUnit) {
      throw new Error(
        `CSV row missing barcode or newBaseUnit: ${JSON.stringify(row)}`,
      );
    }
  }
  return rows;
}

async function main(): Promise<void> {
  const { csvPath } = parseArgs(process.argv);
  const rows = loadRows(csvPath);

  const logger = new Logger('recategorize-products');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = app.get(ProductsService);
    let ok = 0;
    let fail = 0;

    for (const row of rows) {
      const target = row.newBaseUnit.toLowerCase();
      if (!isSupportedBaseUnit(target)) {
        logger.warn(
          `[skip] ${row.barcode}: unsupported baseUnit "${row.newBaseUnit}"`,
        );
        fail++;
        continue;
      }
      try {
        const product = await service.findByBarcode(row.barcode);
        if (!product) {
          logger.warn(`[skip] ${row.barcode}: not found`);
          fail++;
          continue;
        }
        await service.update(product.id, { baseUnit: target });
        logger.log(`[ok] ${row.barcode} -> ${target}`);
        ok++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`[fail] ${row.barcode}: ${message}`);
        fail++;
      }
    }

    logger.log(`done: ${ok} ok, ${fail} failed`);
  } finally {
    await app.close();
  }
}

void main().catch((err: unknown) => {
  // Top-level safety net so the process exits non-zero on
  // argument/CSV/bootstrap errors. Per-row failures are handled inside
  // the loop and never reach here.
  const logger = new Logger('recategorize-products');
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
