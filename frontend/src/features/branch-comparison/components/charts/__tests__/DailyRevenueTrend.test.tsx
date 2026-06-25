import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IBranchAnalyticsTrend } from '@/types';
import { DailyRevenueTrend } from '../DailyRevenueTrend';

// Recharts' ResponsiveContainer relies on ResizeObserver, which jsdom lacks.
// The line SVG never gets real dimensions here, but the header, legend and
// empty state render as plain DOM — which is what these tests assert.
beforeAll(() => {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    globalThis.ResizeObserver =
        ResizeObserverStub as unknown as typeof ResizeObserver;
});

const branchColors = {
    'b-main': 'var(--primary)',
    'b-down': 'var(--accent)',
};

const trend: IBranchAnalyticsTrend = {
    branches: [
        { branchId: 'b-main', branchName: 'Main Branch' },
        { branchId: 'b-down', branchName: 'Downtown Branch' },
    ],
    days: [
        { date: '2026-06-19', byBranch: { 'b-main': 100, 'b-down': 60 } },
        { date: '2026-06-20', byBranch: { 'b-main': 140, 'b-down': 80 } },
    ],
};

describe('DailyRevenueTrend', () => {
    it('renders an EmptyState when there is no trend', () => {
        render(<DailyRevenueTrend trend={undefined} branchColors={{}} />);
        expect(
            screen.getByText('No revenue in this range'),
        ).toBeInTheDocument();
    });

    it('renders an EmptyState when the trend has no branches', () => {
        render(
            <DailyRevenueTrend
                trend={{ branches: [], days: [] }}
                branchColors={{}}
            />,
        );
        expect(
            screen.getByText('No revenue in this range'),
        ).toBeInTheDocument();
    });

    it('renders a legend per branch and the combined total', () => {
        render(
            <DailyRevenueTrend trend={trend} branchColors={branchColors} />,
        );
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
        // 100 + 60 + 140 + 80 = 380, formatted as whole LKR currency.
        expect(screen.getByText(/380/)).toBeInTheDocument();
    });
});
