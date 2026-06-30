import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from '@products/products.service';
import { BranchesService } from '@branches/branches.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { GroupCartItem } from '@/modules/customer-groups/entities/group-cart-item.entity';
import { GroupCartRepository } from '@/modules/customer-groups/group-cart.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { AddGroupCartItemDto } from '@/modules/customer-groups/dto/add-group-cart-item.dto';
import { SetGroupCartItemQtyDto } from '@/modules/customer-groups/dto/set-group-cart-item-qty.dto';
import type { AuthUser } from '@common/types/auth-user.type';
import type {
  GroupCartItemView,
  GroupCartView,
} from '@/modules/customer-groups/types';

/**
 * The group shared cart. Every member of a group reads and writes the SAME cart;
 * each mutation broadcasts `group-cart:changed` so other members' open carts
 * refetch live. The server is the price authority — lines store only
 * product/branch/unit/quantity/amount and prices are resolved on read + at
 * checkout, never trusted from the client.
 */
@Injectable()
export class GroupCartService {
  constructor(
    private readonly groups: CustomerGroupsService,
    private readonly cart: GroupCartRepository,
    private readonly products: ProductsService,
    private readonly branches: BranchesService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async getCart(groupId: string, userId: string): Promise<GroupCartView> {
    await this.groups.assertMembership(groupId, userId);
    const items = await this.cart.listItems(groupId);
    return this.toCartView(groupId, items);
  }

  async addItem(
    groupId: string,
    dto: AddGroupCartItemDto,
    actor: AuthUser,
  ): Promise<GroupCartView> {
    await this.groups.assertMembership(groupId, actor.id);

    const branch = await this.branches.findEntityById(dto.branchId);
    if (!branch || !branch.isActive) {
      throw new BadRequestException('Branch not found or inactive');
    }
    const [product] = await this.products.findActiveByIdsWithUnits([
      dto.productId,
    ]);
    if (!product) {
      throw new BadRequestException('Product is unavailable');
    }

    const unitId = dto.unitId ?? null;
    const unit = this.resolveUnit(product, unitId);
    const unitPrice = unit
      ? Number(unit.sellingPrice)
      : Number(product.sellingPrice);
    const quantity = this.round3(dto.quantity);
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }
    const baseUnitQty = this.round3(
      quantity * (unit ? Number(unit.conversionToBase) : 1),
    );
    if (product.baseUnit === 'unit' && !Number.isInteger(baseUnitQty)) {
      throw new BadRequestException(
        `${product.name} is sold in whole units; quantity ${baseUnitQty} is not allowed`,
      );
    }
    const amount = this.validateAmount(
      product,
      unitPrice,
      quantity,
      dto.amount ?? null,
    );

    const existing = await this.cart.findSameLine(
      groupId,
      dto.productId,
      dto.branchId,
      unitId,
      amount != null,
    );
    if (existing) {
      // Two by-amount adds sum both the cash and the weight; two weight adds
      // sum the weight (amount stays null). Mirrors shopCartSlice.addToCart.
      existing.quantity = this.round3(Number(existing.quantity) + quantity);
      if (amount != null) {
        existing.amount = this.round2(Number(existing.amount ?? 0) + amount);
      }
      await this.cart.saveItem(existing);
    } else {
      await this.cart.saveItem(
        this.cart.createItem({
          customerGroupId: groupId,
          productId: dto.productId,
          branchId: dto.branchId,
          unitId,
          quantity,
          amount,
          addedByUserId: actor.id,
        }),
      );
    }

    this.emitChanged(groupId);
    return this.getCart(groupId, actor.id);
  }

  async setItemQty(
    groupId: string,
    itemId: string,
    dto: SetGroupCartItemQtyDto,
    actor: AuthUser,
  ): Promise<GroupCartView> {
    await this.groups.assertMembership(groupId, actor.id);
    const item = await this.requireItem(groupId, itemId);
    const quantity = this.round3(dto.quantity);
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }
    item.quantity = quantity;
    if (item.amount != null) {
      // Keep a by-amount line consistent: rescale its cash to qty × live price
      // so it still reconciles at checkout.
      const [product] = await this.products.findActiveByIdsWithUnits([
        item.productId,
      ]);
      if (!product) {
        throw new BadRequestException('Product is unavailable');
      }
      const unit = this.resolveUnit(product, item.unitId);
      const unitPrice = unit
        ? Number(unit.sellingPrice)
        : Number(product.sellingPrice);
      item.amount = this.round2(unitPrice * quantity);
    }
    await this.cart.saveItem(item);
    this.emitChanged(groupId);
    return this.getCart(groupId, actor.id);
  }

  async removeItem(
    groupId: string,
    itemId: string,
    actor: AuthUser,
  ): Promise<GroupCartView> {
    await this.groups.assertMembership(groupId, actor.id);
    await this.requireItem(groupId, itemId);
    await this.cart.deleteItem(itemId);
    this.emitChanged(groupId);
    return this.getCart(groupId, actor.id);
  }

  async clearCart(groupId: string, actor: AuthUser): Promise<GroupCartView> {
    await this.groups.assertMembership(groupId, actor.id);
    await this.cart.clear(groupId);
    this.emitChanged(groupId);
    return this.getCart(groupId, actor.id);
  }

  private async requireItem(
    groupId: string,
    itemId: string,
  ): Promise<GroupCartItem> {
    const item = await this.cart.findById(itemId);
    if (!item || item.customerGroupId !== groupId) {
      throw new NotFoundException('Cart item not found');
    }
    return item;
  }

  private resolveUnit(
    product: Product,
    unitId: string | null,
  ): ProductSellableUnit | null {
    const units = product.sellableUnits ?? [];
    if (!unitId) {
      return units.find((u) => u.isBase) ?? null;
    }
    const unit = units.find((u) => u.id === unitId);
    if (!unit) {
      throw new BadRequestException(
        'Selected unit is not valid for this product',
      );
    }
    return unit;
  }

  private validateAmount(
    product: Product,
    unitPrice: number,
    quantity: number,
    amount: number | null,
  ): number | null {
    if (amount == null) {
      return null;
    }
    if (product.baseUnit === 'unit') {
      throw new BadRequestException(
        `${product.name} is sold by the unit and cannot be bought by amount`,
      );
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    const expected = this.round2(unitPrice * quantity);
    const tolerance = Math.max(0.01, unitPrice * 0.001);
    if (Math.abs(amount - expected) > tolerance) {
      throw new BadRequestException(
        `Amount ${amount} does not reconcile with ${quantity} × ${unitPrice} for ${product.name}`,
      );
    }
    return this.round2(amount);
  }

  private toCartView(groupId: string, items: GroupCartItem[]): GroupCartView {
    const lines = items.map((item) => this.toItemView(item));
    const total = this.round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
    return { groupId, items: lines, itemCount: lines.length, total };
  }

  private toItemView(item: GroupCartItem): GroupCartItemView {
    const product = item.product;
    const unit = this.findUnit(product, item.unitId);
    const unitPrice = unit
      ? Number(unit.sellingPrice)
      : Number(product.sellingPrice);
    const quantity = Number(item.quantity);
    const amount = item.amount != null ? Number(item.amount) : null;
    const lineTotal = this.round2(
      amount != null ? amount : unitPrice * quantity,
    );
    return {
      id: item.id,
      productId: item.productId,
      productName: product.name,
      imageUrl: product.imageUrl,
      branchId: item.branchId,
      branchName: item.branch.name,
      unitId: item.unitId,
      unitLabel: unit ? unit.name : product.baseUnit,
      unitPrice,
      quantity,
      amount,
      lineTotal,
      available: product.isActive,
      addedByUserId: item.addedByUserId,
    };
  }

  /** Like resolveUnit but never throws — for displaying an already-saved line. */
  private findUnit(
    product: Product,
    unitId: string | null,
  ): ProductSellableUnit | null {
    const units = product.sellableUnits ?? [];
    if (!unitId) {
      return units.find((u) => u.isBase) ?? null;
    }
    return units.find((u) => u.id === unitId) ?? null;
  }

  private emitChanged(groupId: string): void {
    // Best-effort live nudge — every member's open cart refetches on match.
    this.gateway.broadcast('group-cart:changed', { groupId });
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private round3(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
