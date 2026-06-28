import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { BrandRepository } from '@/modules/brands/brands.repository';
import { CreateBrandDto } from '@/modules/brands/dto/create-brand.dto';
import { UpdateBrandDto } from '@/modules/brands/dto/update-brand.dto';
import { pickBrandColor } from '@/modules/brands/lib/brand-palette';
import type { AuthUser } from '@common/types/auth-user.type';

@Injectable()
export class BrandsService {
  constructor(private readonly brands: BrandRepository) {}

  list(includeInactive = false): Promise<Brand[]> {
    return this.brands.list(includeInactive);
  }

  async create(dto: CreateBrandDto, actor: AuthUser): Promise<Brand> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Brand name is required');
    }
    const existing = await this.brands.findByName(name);
    if (existing) {
      throw new ConflictException(`Brand "${name}" already exists`);
    }
    const count = await this.brands.count();
    return this.brands.save(
      this.brands.create({
        name,
        description: dto.description?.trim() || null,
        color: dto.color?.trim() || pickBrandColor(count),
        sortOrder: dto.sortOrder ?? count,
        createdByUserId: actor.id,
      }),
    );
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found`);
    }

    let renamed = false;
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Brand name is required');
      }
      if (name !== brand.name) {
        const clash = await this.brands.findByName(name);
        if (clash && clash.id !== id) {
          throw new ConflictException(`Brand "${name}" already exists`);
        }
        brand.name = name;
        renamed = true;
      }
    }
    if (dto.description !== undefined) {
      brand.description = dto.description?.trim() || null;
    }
    if (dto.color !== undefined) {
      brand.color = dto.color?.trim() || null;
    }
    if (dto.sortOrder !== undefined) {
      brand.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      brand.isActive = dto.isActive;
    }

    const saved = await this.brands.save(brand);
    if (renamed) {
      // Keep the denormalized product.brand mirror correct after a rename.
      await this.brands.syncProductBrandName(id, saved.name);
    }
    return saved;
  }

  /** Soft-archive (isActive=false). Admin only — products keep their FK. */
  async archive(id: string): Promise<Brand> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found`);
    }
    brand.isActive = false;
    return this.brands.save(brand);
  }
}
