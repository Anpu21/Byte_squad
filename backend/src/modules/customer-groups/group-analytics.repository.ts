import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { CustomerOrderPaymentStatus } from '@common/enums/customer-order-payment-status.enum';
import type {
  GroupMemberSpendRow,
  GroupProductSpendRow,
  GroupTrendPoint,
} from '@/modules/customer-groups/types';

export interface GroupAnalyticsParams {
  groupId: string;
  startDate: Date;
  endDate: Date;
}

export interface GroupAnalyticsSummary {
  spend: number;
  orders: number;
  members: number;
}

// A group order's line value: the firm cash for a buy-by-amount line, else
// unit price × quantity (customer_order_items has no stored line_total).
const LINE_VALUE =
  'COALESCE(i.fixed_price_override, i.unit_price_snapshot * i.quantity)';

interface SummaryRaw {
  spend: string | null;
  orders: string | null;
  members: string | null;
}
interface MemberRaw {
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  spend: string | null;
  orders: string | null;
}
interface ProductRaw {
  productId: string;
  productName: string;
  units: string | null;
  revenue: string | null;
}
interface TrendRaw {
  day: string;
  revenue: string | null;
}

/**
 * Group purchase-analytics aggregations (DataSource-injected per Rules.md §7).
 * Mirrors the brand-analytics shape but sources from customer_orders /
 * customer_order_items scoped to one customer group. "Real purchases" only:
 * orders that are COMPLETED (collected) or PAID (online). Order-level KPIs and
 * item-level breakdowns use separate queries so the item join never overcounts
 * order spend.
 */
@Injectable()
export class GroupAnalyticsRepository {
  private readonly orders: Repository<CustomerOrder>;
  private readonly items: Repository<CustomerOrderItem>;

  constructor(private readonly dataSource: DataSource) {
    this.orders = dataSource.getRepository(CustomerOrder);
    this.items = dataSource.getRepository(CustomerOrderItem);
  }

  private ordersBase(
    params: GroupAnalyticsParams,
  ): SelectQueryBuilder<CustomerOrder> {
    return this.orders
      .createQueryBuilder('co')
      .where('co.customer_group_id = :groupId', { groupId: params.groupId })
      .andWhere('co.created_at BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      })
      .andWhere('(co.status = :completed OR co.payment_status = :paid)', {
        completed: CustomerOrderStatus.COMPLETED,
        paid: CustomerOrderPaymentStatus.PAID,
      });
  }

  async summary(params: GroupAnalyticsParams): Promise<GroupAnalyticsSummary> {
    const raw = await this.ordersBase(params)
      .select('COALESCE(SUM(co.final_total), 0)', 'spend')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('COUNT(DISTINCT co.user_id)', 'members')
      .getRawOne<SummaryRaw>();
    return {
      spend: Number(raw?.spend ?? 0),
      orders: Number(raw?.orders ?? 0),
      members: Number(raw?.members ?? 0),
    };
  }

  async byMember(params: GroupAnalyticsParams): Promise<GroupMemberSpendRow[]> {
    const rows = await this.ordersBase(params)
      .leftJoin('co.user', 'u')
      .select('co.user_id', 'userId')
      .addSelect('u.first_name', 'firstName')
      .addSelect('u.last_name', 'lastName')
      .addSelect('u.email', 'email')
      .addSelect('COALESCE(SUM(co.final_total), 0)', 'spend')
      .addSelect('COUNT(*)', 'orders')
      .groupBy('co.user_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .addGroupBy('u.email')
      .orderBy('COALESCE(SUM(co.final_total), 0)', 'DESC')
      .getRawMany<MemberRaw>();
    return rows.map((r) => ({
      userId: r.userId ?? '',
      name:
        `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() ||
        r.email ||
        'Unknown',
      spend: Number(r.spend ?? 0),
      orders: Number(r.orders ?? 0),
      sharePct: 0,
    }));
  }

  async byProduct(
    params: GroupAnalyticsParams,
  ): Promise<GroupProductSpendRow[]> {
    const rows = await this.items
      .createQueryBuilder('i')
      .innerJoin('i.order', 'co')
      .innerJoin('i.product', 'p')
      .where('co.customer_group_id = :groupId', { groupId: params.groupId })
      .andWhere('co.created_at BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      })
      .andWhere('(co.status = :completed OR co.payment_status = :paid)', {
        completed: CustomerOrderStatus.COMPLETED,
        paid: CustomerOrderPaymentStatus.PAID,
      })
      .select('p.id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('COALESCE(SUM(i.base_unit_qty), 0)', 'units')
      .addSelect(`COALESCE(SUM(${LINE_VALUE}), 0)`, 'revenue')
      .groupBy('p.id')
      .addGroupBy('p.name')
      .orderBy(`COALESCE(SUM(${LINE_VALUE}), 0)`, 'DESC')
      .getRawMany<ProductRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      sharePct: 0,
    }));
  }

  async trend(params: GroupAnalyticsParams): Promise<GroupTrendPoint[]> {
    const dayExpr = "TO_CHAR(co.created_at, 'YYYY-MM-DD')";
    const rows = await this.ordersBase(params)
      .select(dayExpr, 'day')
      .addSelect('COALESCE(SUM(co.final_total), 0)', 'revenue')
      .groupBy(dayExpr)
      .orderBy(dayExpr, 'ASC')
      .getRawMany<TrendRaw>();
    return rows.map((r) => ({ date: r.day, revenue: Number(r.revenue ?? 0) }));
  }
}
