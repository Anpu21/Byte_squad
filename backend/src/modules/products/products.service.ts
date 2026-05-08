import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';

const CLOUDINARY_FOLDER = 'ledgerpro/products';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { barcode } });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async getCategories(): Promise<string[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true })
      .distinct(true)
      .getRawMany();
    return results.map((r: { category: string }) => r.category);
  }

  async remove(id: string): Promise<void> {
    await this.productRepository.update(id, { isActive: false });
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
    const product = await this.productRepository.findOne({ where: { id } });
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

    await this.productRepository.update(id, { imageUrl });
    const refreshed = await this.productRepository.findOne({ where: { id } });
    return refreshed!;
  }
}
