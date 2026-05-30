import { Injectable, NotFoundException } from '@nestjs/common';
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
   * - Otherwise we fall back to `defaultSellableUnitsFor` — e.g. a
   *   `kg`-based product gets `[kg, g]`, a discrete `each`-based product
   *   gets a single self-mirror row.
   *
   * The migration that powered the Phase A1 backfill
   * (`backfillDefaultSellableUnits`) is idempotent and still acts as a
   * safety net for any historical orphans.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.sellableUnits) {
      validateSellableUnits(createProductDto.sellableUnits);
    }
    return this.dataSource.transaction(async (manager) => {
      const product = await this.products.createAndSave(createProductDto);
      const seeds = createProductDto.sellableUnits
        ? stampProductId(product.id, createProductDto.sellableUnits)
        : defaultSellableUnitsFor(product.id, product.baseUnit);
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
    if (updateProductDto.sellableUnits) {
      validateSellableUnits(updateProductDto.sellableUnits);
    }
    const unitsProvided = updateProductDto.sellableUnits !== undefined;
    const baseUnitChanged =
      updateProductDto.baseUnit !== undefined &&
      updateProductDto.baseUnit !== existing.baseUnit;

    Object.assign(existing, updateProductDto);

    return this.dataSource.transaction(async (manager) => {
      const saved = await this.products.save(existing);
      if (unitsProvided && updateProductDto.sellableUnits) {
        await this.products.replaceUnits(
          saved.id,
          stampProductId(saved.id, updateProductDto.sellableUnits),
          manager,
        );
      } else if (baseUnitChanged) {
        await this.products.replaceUnits(
          saved.id,
          defaultSellableUnitsFor(saved.id, saved.baseUnit),
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
}
