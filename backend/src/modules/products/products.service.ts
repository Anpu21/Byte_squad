import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { ProductsRepository } from '@products/products.repository';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { SellableUnitDto } from '@products/dto/sellable-unit.dto';
import { defaultSellableUnitsFor } from '@products/lib/default-sellable-units';
import { validateSellableUnits } from '@products/lib/validate-sellable-units';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';

const CLOUDINARY_FOLDER = 'ledgerpro/products';

/**
 * Stamp the owning productId onto each sellable-unit row supplied by the
 * manager. Returns a plain object array shaped for `saveUnits` /
 * `replaceUnits` — no `as any` needed; `DeepPartial<ProductSellableUnit>`
 * is satisfied by the spread.
 */
function stampProductId(
  productId: string,
  rows: readonly SellableUnitDto[],
): Array<Partial<ProductSellableUnit>> {
  return rows.map((row) => ({ ...row, productId }));
}

function normalizeSellableUnits(
  rows: readonly SellableUnitDto[] | undefined,
): SellableUnitDto[] | undefined {
  if (!rows) return undefined;
  return rows.map((row) => ({
    ...row,
    name: row.name.trim(),
    barcode: row.barcode?.trim() || null,
    conversionToBase: Number(row.conversionToBase),
    sellingPrice: Number(row.sellingPrice),
    displayOrder: Number(row.displayOrder),
  }));
}

function unitBarcodes(rows: readonly SellableUnitDto[] | undefined): string[] {
  if (!rows) return [];
  return rows
    .map((row) => row.barcode?.trim())
    .filter((barcode): barcode is string => Boolean(barcode));
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly cloudinary: CloudinaryService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Persist a new product and its sellable-unit rows inside a single
   * transaction so we never end up with a product row whose unit list
   * silently failed to land.
   *
   * Two branches:
   * - If the manager supplied `sellableUnits` on the DTO we validate the
   *   rows (`validateSellableUnits`: exactly one base, conversion=1 on the
   *   base, no duplicate names) and persist them verbatim.
   * - Otherwise we fall back to `defaultSellableUnitsFor` — one base sellable
   *   row for `kg`, `l`, or `unit`.
   *
   * The migration that powered the Phase A1 backfill
   * (`backfillDefaultSellableUnits`) is idempotent and still acts as a
   * safety net for any historical orphans.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const sellableUnits = normalizeSellableUnits(
      createProductDto.sellableUnits,
    );
    if (sellableUnits) {
      validateSellableUnits(sellableUnits);
    }
    await this.assertBarcodeAvailability(
      createProductDto.barcode,
      sellableUnits,
    );
    return this.dataSource.transaction(async (manager) => {
      const { sellableUnits: _units, ...productInput } = createProductDto;
      void _units;
      const product = await this.products.createAndSave(productInput, manager);
      const seeds = sellableUnits
        ? stampProductId(product.id, sellableUnits)
        : defaultSellableUnitsFor(
            product.id,
            product.baseUnit,
            Number(product.sellingPrice),
          );
      await this.products.saveUnits(seeds, manager);
      return product;
    });
  }

  async findAll(): Promise<Product[]> {
    return this.products.findActive();
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.findById(id);
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.products.findByBarcode(barcode);
  }

  /**
   * Update a product and (when relevant) atomically replace its sellable
   * units. Precedence — explicit `sellableUnits` wins over implicit
   * re-seed from a changed `baseUnit`:
   *
   * 1. `sellableUnits` provided → validate + replace with those exact rows.
   * 2. else `baseUnit` changed   → re-seed from `defaultSellableUnitsFor`.
   * 3. else                      → leave units untouched.
   *
   * Both the product row and the unit replacement share one EntityManager
   * so a failure in either rolls the whole edit back.
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const existing = await this.products.findById(id);
    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    const sellableUnits = normalizeSellableUnits(
      updateProductDto.sellableUnits,
    );
    if (sellableUnits) {
      validateSellableUnits(sellableUnits);
    }
    const unitsProvided = sellableUnits !== undefined;
    const baseUnitChanged =
      updateProductDto.baseUnit !== undefined &&
      updateProductDto.baseUnit !== existing.baseUnit;
    const nextBarcode = updateProductDto.barcode ?? existing.barcode ?? '';
    await this.assertBarcodeAvailability(nextBarcode, sellableUnits, {
      currentProductId: id,
      willReplaceUnits: unitsProvided || baseUnitChanged,
    });

    const { sellableUnits: _units, ...productPatch } = updateProductDto;
    void _units;
    Object.assign(existing, productPatch);

    return this.dataSource.transaction(async (manager) => {
      const saved = await this.products.save(existing, manager);
      if (unitsProvided && sellableUnits) {
        await this.products.replaceUnits(
          saved.id,
          stampProductId(saved.id, sellableUnits),
          manager,
        );
      } else if (baseUnitChanged) {
        await this.products.replaceUnits(
          saved.id,
          defaultSellableUnitsFor(
            saved.id,
            saved.baseUnit,
            Number(saved.sellingPrice),
          ),
          manager,
        );
      }
      return saved;
    });
  }

  async getCategories(): Promise<string[]> {
    return this.products.listDistinctActiveCategories();
  }

  async remove(id: string): Promise<void> {
    await this.products.setActive(id, false);
  }

  /**
   * Persist a product image. When Cloudinary is enabled the image is uploaded
   * there and the secure URL is stored on the row; otherwise we fall back to
   * a base64 data URL embedded in the column. Pass `file = null` to clear.
   */
  async setImage(
    id: string,
    file: Express.Multer.File | null,
  ): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    let imageUrl: string | null;
    if (this.cloudinary.isEnabled()) {
      if (file) {
        const { url } = await this.cloudinary.uploadImage(file, {
          folder: CLOUDINARY_FOLDER,
          publicId: id,
        });
        imageUrl = url;
      } else {
        await this.cloudinary.deleteImage(`${CLOUDINARY_FOLDER}/${id}`);
        imageUrl = null;
      }
    } else {
      imageUrl = file
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : null;
    }

    await this.products.update(id, { imageUrl });
    const refreshed = await this.products.findById(id);
    return refreshed!;
  }

  private async assertBarcodeAvailability(
    productBarcode: string | null | undefined,
    rows: readonly SellableUnitDto[] | undefined,
    options: {
      currentProductId?: string;
      willReplaceUnits?: boolean;
    } = {},
  ): Promise<void> {
    const normalizedProductBarcode = productBarcode?.trim() ?? '';
    const productKey = normalizedProductBarcode.toLowerCase();
    const barcodes = unitBarcodes(rows);
    const unitBarcodeKeys = new Set(
      barcodes.map((barcode) => barcode.toLowerCase()),
    );
    if (productKey && unitBarcodeKeys.has(productKey)) {
      throw new ConflictException(
        'A sellable-unit barcode cannot match the product barcode.',
      );
    }

    if (normalizedProductBarcode) {
      const existingUnit = await this.products.findUnitByBarcode(
        normalizedProductBarcode,
      );
      if (
        existingUnit &&
        (existingUnit.productId !== options.currentProductId ||
          !options.willReplaceUnits)
      ) {
        throw new ConflictException(
          `Barcode ${normalizedProductBarcode} is already assigned to a sellable unit.`,
        );
      }
    }

    if (barcodes.length === 0) return;

    const productConflicts = await this.products.findByBarcodes(barcodes);
    if (productConflicts.length > 0) {
      throw new ConflictException(
        `Sellable-unit barcode ${productConflicts[0].barcode} conflicts with a product barcode.`,
      );
    }

    const unitConflicts = await this.products.findUnitsByBarcodes(
      barcodes,
      options.currentProductId,
    );
    if (unitConflicts.length > 0) {
      throw new ConflictException(
        `Sellable-unit barcode ${unitConflicts[0].barcode ?? ''} is already in use.`,
      );
    }
  }
}
