import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
}
