import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { CreateSupplierDto } from '@/modules/suppliers/dto/create-supplier.dto';
import { UpdateSupplierDto } from '@/modules/suppliers/dto/update-supplier.dto';
import { ListSuppliersQueryDto } from '@/modules/suppliers/dto/list-suppliers-query.dto';

export interface SuppliersActor {
  id: string;
}

export interface SuppliersListResponse {
  rows: Supplier[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Supplier master business logic. Suppliers are global (purchase documents
 * carry the branch) and are never hard-deleted — deactivate via
 * `status: 'Inactive'` so historical GRNs keep a valid reference.
 */
@Injectable()
export class SuppliersService {
  constructor(private readonly suppliers: SuppliersRepository) {}

  async list(query: ListSuppliersQueryDto): Promise<SuppliersListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const { rows, total } = await this.suppliers.list({
      search: query.search,
      status: query.status,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  async getById(id: string): Promise<Supplier> {
    const supplier = await this.suppliers.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(
    dto: CreateSupplierDto,
    actor: SuppliersActor,
  ): Promise<Supplier> {
    await this.assertNameAvailable(dto.name);
    return this.suppliers.create({
      name: dto.name.trim(),
      contactName: dto.contactName ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      creditTermDays: dto.creditTermDays ?? 30,
      openingBalance: dto.openingBalance ?? 0,
      notes: dto.notes ?? null,
      createdByUserId: actor.id,
    });
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.getById(id);
    if (
      dto.name &&
      dto.name.trim().toLowerCase() !== supplier.name.toLowerCase()
    ) {
      await this.assertNameAvailable(dto.name);
    }

    if (dto.name !== undefined) supplier.name = dto.name.trim();
    if (dto.contactName !== undefined) supplier.contactName = dto.contactName;
    if (dto.phone !== undefined) supplier.phone = dto.phone;
    if (dto.email !== undefined) supplier.email = dto.email;
    if (dto.address !== undefined) supplier.address = dto.address;
    if (dto.creditTermDays !== undefined)
      supplier.creditTermDays = dto.creditTermDays;
    if (dto.openingBalance !== undefined)
      supplier.openingBalance = dto.openingBalance;
    if (dto.status !== undefined) supplier.status = dto.status;
    if (dto.notes !== undefined) supplier.notes = dto.notes;

    return this.suppliers.save(supplier);
  }

  private async assertNameAvailable(name: string): Promise<void> {
    const existing = await this.suppliers.findByName(name.trim());
    if (existing) {
      throw new ConflictException(
        `A supplier named "${existing.name}" already exists`,
      );
    }
  }
}
