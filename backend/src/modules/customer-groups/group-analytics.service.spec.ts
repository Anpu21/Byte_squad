import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GroupAnalyticsService } from '@/modules/customer-groups/group-analytics.service';
import { GroupAnalyticsRepository } from '@/modules/customer-groups/group-analytics.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';

const member: AuthUser = {
  id: 'u-member',
  email: 'member@x.com',
  role: UserRole.CUSTOMER,
  branchId: null,
};

const range = { startDate: '2026-06-01', endDate: '2026-06-03' };

describe('GroupAnalyticsService', () => {
  let service: GroupAnalyticsService;
  let groups: { assertMembership: jest.Mock };
  let analytics: {
    summary: jest.Mock;
    byMember: jest.Mock;
    byProduct: jest.Mock;
    trend: jest.Mock;
  };

  beforeEach(async () => {
    groups = { assertMembership: jest.fn().mockResolvedValue(undefined) };
    analytics = {
      summary: jest
        .fn()
        .mockResolvedValue({ spend: 1000, orders: 4, members: 2 }),
      byMember: jest.fn().mockResolvedValue([
        { userId: 'u1', name: 'Asha', spend: 600, orders: 2, sharePct: 0 },
        { userId: 'u2', name: 'Ravi', spend: 400, orders: 2, sharePct: 0 },
      ]),
      byProduct: jest.fn().mockResolvedValue([
        {
          productId: 'p1',
          productName: 'Rice',
          units: 10,
          revenue: 700,
          sharePct: 0,
        },
      ]),
      trend: jest
        .fn()
        .mockResolvedValue([{ date: '2026-06-02', revenue: 500 }]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GroupAnalyticsService,
        { provide: CustomerGroupsService, useValue: groups },
        { provide: GroupAnalyticsRepository, useValue: analytics },
      ],
    }).compile();
    service = moduleRef.get(GroupAnalyticsService);
  });

  it('computes KPIs, share %, and a zero-filled trend (member-scoped)', async () => {
    const res = await service.getAnalytics('g1', range, member);
    expect(groups.assertMembership).toHaveBeenCalledWith('g1', 'u-member');
    expect(res.totalSpend).toBe(1000);
    expect(res.orderCount).toBe(4);
    expect(res.avgOrderValue).toBe(250);
    expect(res.memberCount).toBe(2);
    expect(res.byMember[0].sharePct).toBeCloseTo(60, 1);
    expect(res.byProduct[0].sharePct).toBeCloseTo(70, 1);
    // 3-day inclusive window, only the middle day has data.
    expect(res.trend).toHaveLength(3);
    expect(res.trend[0]).toEqual({ date: '2026-06-01', revenue: 0 });
    expect(res.trend[1]).toEqual({ date: '2026-06-02', revenue: 500 });
  });

  it('rejects an invalid or inverted date range', async () => {
    await expect(
      service.getAnalytics(
        'g1',
        { startDate: 'nope', endDate: 'nope' },
        member,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.getAnalytics(
        'g1',
        { startDate: '2026-06-30', endDate: '2026-06-01' },
        member,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
