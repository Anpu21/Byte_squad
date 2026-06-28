import { BadRequestException, Injectable } from '@nestjs/common';
import { GroupAnalyticsRepository } from '@/modules/customer-groups/group-analytics.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { GroupAnalyticsQueryDto } from '@/modules/customer-groups/dto/group-analytics-query.dto';
import type { AuthUser } from '@common/types/auth-user.type';
import type {
  GroupAnalyticsResponse,
  GroupTrendPoint,
} from '@/modules/customer-groups/types';

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Fill every day in [start, end] so the FE trend line has no gaps. */
function zeroFillTrend(
  rows: GroupTrendPoint[],
  start: Date,
  end: Date,
): GroupTrendPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r.revenue]));
  const out: GroupTrendPoint[] = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ date: key, revenue: byDate.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/**
 * Consolidated purchase analytics for a group. Membership-scoped (any member can
 * view — a group is cross-branch, so there's no branch scoping). Mirrors the
 * brand-analytics service shape: KPIs + by-member + by-product + zero-filled
 * daily trend.
 */
@Injectable()
export class GroupAnalyticsService {
  constructor(
    private readonly groups: CustomerGroupsService,
    private readonly analytics: GroupAnalyticsRepository,
  ) {}

  async getAnalytics(
    groupId: string,
    query: GroupAnalyticsQueryDto,
    actor: AuthUser,
  ): Promise<GroupAnalyticsResponse> {
    await this.groups.assertMembership(groupId, actor.id);
    const { startDate, endDate } = this.parseRange(query);
    const params = { groupId, startDate, endDate };

    const [summary, byMember, byProduct, trendRows] = await Promise.all([
      this.analytics.summary(params),
      this.analytics.byMember(params),
      this.analytics.byProduct(params),
      this.analytics.trend(params),
    ]);

    const totalSpend = summary.spend;
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupId,
      totalSpend,
      orderCount: summary.orders,
      avgOrderValue:
        summary.orders > 0 ? round2(totalSpend / summary.orders) : 0,
      memberCount: summary.members,
      byMember: byMember.map((m) => ({
        ...m,
        sharePct: percent(m.spend, totalSpend),
      })),
      byProduct: byProduct.map((p) => ({
        ...p,
        sharePct: percent(p.revenue, totalSpend),
      })),
      trend: zeroFillTrend(trendRows, startDate, endDate),
    };
  }

  private parseRange(query: GroupAnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }
    return { startDate, endDate };
  }
}
