import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    timeAgo,
    typeLabel,
    typeBadgeColor,
    groupByDate,
} from './notificationUtils';
import { NotificationType } from '@/constants/enums';
import type { INotification } from '@/types';

describe('timeAgo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-11T12:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('returns "Just now" for under a minute', () => {
        expect(timeAgo('2026-05-11T11:59:30Z')).toBe('Just now');
    });

    it('returns minutes for < 1 hour', () => {
        expect(timeAgo('2026-05-11T11:30:00Z')).toBe('30m ago');
    });

    it('returns hours for < 1 day', () => {
        expect(timeAgo('2026-05-11T08:00:00Z')).toBe('4h ago');
    });

    it('returns "Yesterday" for exactly one day ago', () => {
        expect(timeAgo('2026-05-10T12:00:00Z')).toBe('Yesterday');
    });
});

describe('typeLabel + typeBadgeColor', () => {
    it.each([
        [NotificationType.LOW_STOCK, 'Low Stock'],
        [NotificationType.SYSTEM, 'System'],
        [NotificationType.ALERT, 'Alert'],
    ] as const)('typeLabel(%s) → %s', (type, label) => {
        expect(typeLabel(type)).toBe(label);
    });

    it('returns warning palette for LOW_STOCK', () => {
        expect(typeBadgeColor(NotificationType.LOW_STOCK)).toContain('warning');
    });
});

describe('groupByDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-11T12:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    const mk = (id: string, createdAt: string): INotification => ({
        id,
        userId: 'u1',
        title: 't',
        message: 'm',
        type: NotificationType.SYSTEM,
        isRead: false,
        metadata: {},
        createdAt,
    });

    it('puts items into the right buckets', () => {
        const groups = groupByDate([
            mk('a', '2026-05-11T08:00:00Z'),
            mk('b', '2026-05-10T08:00:00Z'),
            mk('c', '2026-04-01T08:00:00Z'),
        ]);

        const labels = groups.map((g) => g.label);
        expect(labels).toEqual(
            expect.arrayContaining(['Today', 'Yesterday', 'Earlier']),
        );
    });

    it('returns no empty buckets', () => {
        const groups = groupByDate([mk('a', '2026-05-11T08:00:00Z')]);
        expect(groups).toHaveLength(1);
        expect(groups[0].label).toBe('Today');
        expect(groups[0].notifications).toHaveLength(1);
    });
});
