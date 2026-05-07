import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sellingPrice: number;
  imageUrl: string | null;
}

export interface PublicBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface ListProductsQuery {
  category?: string;
  search?: string;
}

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async listProducts(query: ListProductsQuery): Promise<PublicProduct[]> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.is_active = :isActive', { isActive: true })
      .orderBy('p.name', 'ASC');

    if (query.category) {
      qb.andWhere('p.category = :category', { category: query.category });
    }
    if (query.search) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        "(LOWER(p.name) LIKE LOWER(:term) OR LOWER(COALESCE(p.description, '')) LIKE LOWER(:term))",
        { term },
      );
    }

    const products = await qb.getMany();
    return products.map((p) => this.toPublicProduct(p));
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.is_active = :isActive', { isActive: true })
      .orderBy('p.category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category).filter((c): c is string => Boolean(c));
  }

  async getProduct(id: string): Promise<PublicProduct> {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.toPublicProduct(product);
  }

  async listActiveBranches(): Promise<PublicBranch[]> {
    const branches = await this.branchRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
    }));
  }

  private toPublicProduct(p: Product): PublicProduct {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      sellingPrice: Number(p.sellingPrice),
      imageUrl: p.imageUrl,
    };
  }
}
