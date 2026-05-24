import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@products/entities/product.entity';
import { ProductsRepository } from '@products/products.repository';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { defaultSellableUnitsFor } from '@products/lib/default-sellable-units';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';

const CLOUDINARY_FOLDER = 'ledgerpro/products';

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Persist a new product row and immediately seed its default sellable
   * units (Phase A2). The companions are derived from the row's `baseUnit`
   * by `defaultSellableUnitsFor` — e.g. a `kg`-based product gets `[kg, g]`,
   * a discrete `each`-based product gets a single self-mirror row.
   *
   * The two writes are not wrapped in a single transaction: the product is
   * persisted first so we have its id for the seed `productId`, then the
   * units land in a separate batch. The migration that powered the Phase
   * A1 backfill (`backfillDefaultSellableUnits`) is idempotent and would
   * pick up any orphan product that managed to skip the second write.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.products.createAndSave(createProductDto);
    const seeds = defaultSellableUnitsFor(product.id, product.baseUnit);
    await this.products.saveUnits(seeds);
    return product;
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    Object.assign(product, updateProductDto);
    return this.products.save(product);
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
