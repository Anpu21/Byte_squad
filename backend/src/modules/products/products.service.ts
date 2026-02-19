import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

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

    async remove(id: string): Promise<void> {
        await this.productRepository.update(id, { isActive: false });
    }
}
