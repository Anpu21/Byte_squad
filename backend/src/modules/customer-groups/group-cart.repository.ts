import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GroupCartItem } from '@/modules/customer-groups/entities/group-cart-item.entity';

/**
 * Group shared-cart repository (DataSource-injected per Rules.md §7). Owns the
 * GroupCartItem rows that make up a group's single shared cart.
 */
@Injectable()
export class GroupCartRepository {
  private readonly items: Repository<GroupCartItem>;

  constructor(private readonly dataSource: DataSource) {
    this.items = dataSource.getRepository(GroupCartItem);
  }

  createItem(input: Partial<GroupCartItem>): GroupCartItem {
    return this.items.create(input);
  }

  saveItem(item: GroupCartItem): Promise<GroupCartItem> {
    return this.items.save(item);
  }

  findById(id: string): Promise<GroupCartItem | null> {
    return this.items.findOne({ where: { id } });
  }

  /** Same line = (group, product, branch, unit, by-amount) — for merge-on-add. */
  findSameLine(
    customerGroupId: string,
    productId: string,
    branchId: string,
    unitId: string | null,
    byAmount: boolean,
  ): Promise<GroupCartItem | null> {
    const qb = this.items
      .createQueryBuilder('i')
      .where('i.customer_group_id = :customerGroupId', { customerGroupId })
      .andWhere('i.product_id = :productId', { productId })
      .andWhere('i.branch_id = :branchId', { branchId })
      .andWhere(byAmount ? 'i.amount IS NOT NULL' : 'i.amount IS NULL');
    if (unitId === null) {
      qb.andWhere('i.unit_id IS NULL');
    } else {
      qb.andWhere('i.unit_id = :unitId', { unitId });
    }
    return qb.getOne();
  }

  /** Cart lines with product (+ its sellable units) and branch loaded. */
  listItems(customerGroupId: string): Promise<GroupCartItem[]> {
    return this.items
      .createQueryBuilder('i')
      .innerJoinAndSelect('i.product', 'p')
      .leftJoinAndSelect('p.sellableUnits', 'u')
      .innerJoinAndSelect('i.branch', 'b')
      .where('i.customer_group_id = :customerGroupId', { customerGroupId })
      .orderBy('i.created_at', 'ASC')
      .getMany();
  }

  async deleteItem(id: string): Promise<void> {
    await this.items.delete({ id });
  }

  async clear(customerGroupId: string): Promise<void> {
    await this.items.delete({ customerGroupId });
  }

  countItems(customerGroupId: string): Promise<number> {
    return this.items.count({ where: { customerGroupId } });
  }
}
