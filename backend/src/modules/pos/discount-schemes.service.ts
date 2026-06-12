import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { DiscountScheme } from '@pos/entities/discount-scheme.entity';
import { DiscountSchemesRepository } from '@pos/discount-schemes.repository';
import { CreateDiscountSchemeDto } from '@pos/dto/create-discount-scheme.dto';
import { UpdateDiscountSchemeDto } from '@pos/dto/update-discount-scheme.dto';

export interface SchemesActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

/**
 * Discount-scheme management. Managers may only run schemes for their
 * own branch; admins can also create global (all-branch) rules. The
 * POS pulls the active set and applies the best match client-side —
 * the cashier's manual discount always wins.
 */
@Injectable()
export class DiscountSchemesService {
  constructor(private readonly schemes: DiscountSchemesRepository) {}

  async list(actor: SchemesActor, isActive?: boolean) {
    const { rows, total } = await this.schemes.list({
      branchId:
        actor.role === UserRole.ADMIN
          ? undefined
          : (actor.branchId ?? undefined),
      isActive,
      limit: 100,
      offset: 0,
    });
    return { rows, total };
  }

  async activeForCashier(actor: SchemesActor): Promise<DiscountScheme[]> {
    if (!actor.branchId) return [];
    const today = new Date().toISOString().slice(0, 10);
    return this.schemes.findActiveForBranch(actor.branchId, today);
  }

  async create(
    dto: CreateDiscountSchemeDto,
    actor: SchemesActor,
  ): Promise<DiscountScheme> {
    this.assertDates(dto.startDate, dto.endDate);
    const branchId = this.resolveBranch(dto.branchId, actor);
    return this.schemes.create({
      name: dto.name.trim(),
      branchId,
      scope: dto.scope,
      productId: dto.scope === 'Product' ? (dto.productId ?? null) : null,
      category: dto.scope === 'Category' ? (dto.category ?? null) : null,
      minQty: dto.minQty ?? 0,
      discountPercentage: dto.discountPercentage,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isActive: dto.isActive ?? true,
      createdByUserId: actor.id,
    });
  }

  async update(
    id: string,
    dto: UpdateDiscountSchemeDto,
    actor: SchemesActor,
  ): Promise<DiscountScheme> {
    const scheme = await this.getOwned(id, actor);
    if (dto.startDate || dto.endDate) {
      this.assertDates(
        dto.startDate ?? scheme.startDate,
        dto.endDate ?? scheme.endDate,
      );
    }

    if (dto.name !== undefined) scheme.name = dto.name.trim();
    if (dto.scope !== undefined) scheme.scope = dto.scope;
    if (dto.productId !== undefined) scheme.productId = dto.productId;
    if (dto.category !== undefined) scheme.category = dto.category;
    if (dto.minQty !== undefined) scheme.minQty = dto.minQty;
    if (dto.discountPercentage !== undefined)
      scheme.discountPercentage = dto.discountPercentage;
    if (dto.startDate !== undefined) scheme.startDate = dto.startDate;
    if (dto.endDate !== undefined) scheme.endDate = dto.endDate;
    if (dto.isActive !== undefined) scheme.isActive = dto.isActive;
    if (scheme.scope === 'Product') scheme.category = null;
    if (scheme.scope === 'Category') scheme.productId = null;

    return this.schemes.save(scheme);
  }

  async remove(id: string, actor: SchemesActor): Promise<void> {
    await this.getOwned(id, actor);
    await this.schemes.remove(id);
  }

  private async getOwned(
    id: string,
    actor: SchemesActor,
  ): Promise<DiscountScheme> {
    const scheme = await this.schemes.findById(id);
    if (!scheme) throw new NotFoundException('Scheme not found');
    if (actor.role !== UserRole.ADMIN && scheme.branchId !== actor.branchId) {
      throw new ForbiddenException('Cannot manage schemes outside your branch');
    }
    return scheme;
  }

  private resolveBranch(
    requested: string | undefined,
    actor: SchemesActor,
  ): string | null {
    if (actor.role === UserRole.ADMIN) return requested ?? null;
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot create schemes for another branch');
    }
    return actor.branchId;
  }

  private assertDates(start: string, end: string): void {
    if (new Date(start).getTime() > new Date(end).getTime()) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
  }
}
