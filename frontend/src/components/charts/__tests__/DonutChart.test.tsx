import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import DonutChart, { type DonutSlice } from '../DonutChart';

// Recharts' ResponsiveContainer relies on ResizeObserver, which jsdom lacks.
// The donut SVG never gets real dimensions here, but the legend + centre + empty
// states render as plain DOM, which is what these tests assert.
beforeAll(() => {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    globalThis.ResizeObserver =
        ResizeObserverStub as unknown as typeof ResizeObserver;
});

const slices: DonutSlice[] = [
    { name: 'Cash', value: 60, color: 'var(--primary)' },
    { name: 'Card', value: 40, color: 'var(--accent)' },
];

describe('DonutChart', () => {
    it('renders an EmptyState when there is no data', () => {
        render(<DonutChart data={[]} emptyLabel="Nothing here" />);
        expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('renders an EmptyState when the slices sum to zero', () => {
        render(
            <DonutChart
                data={[{ name: 'A', value: 0, color: 'var(--primary)' }]}
                emptyLabel="All zero"
            />,
        );
        expect(screen.getByText('All zero')).toBeInTheDocument();
    });

    it('renders a legend with each slice name, formatted value and percent', () => {
        render(<DonutChart data={slices} formatValue={(v) => `R${v}`} />);
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Card')).toBeInTheDocument();
        expect(screen.getByText('R60')).toBeInTheDocument();
        expect(screen.getByText('R40')).toBeInTheDocument();
        // 60 / 100 and 40 / 100 of the total.
        expect(screen.getByText('60.0%')).toBeInTheDocument();
        expect(screen.getByText('40.0%')).toBeInTheDocument();
    });

    it('stacks the legend full-width below the ring in column layout', () => {
        render(<DonutChart data={slices} layout="column" />);
        const legend = screen.getByRole('list');
        // Full-width rows (not the side-by-side flex-1 legend) — the narrow-card
        // mode that keeps name + value + percent inside the card bounds.
        expect(legend.className).toContain('w-full');
        expect(legend.className).not.toContain('flex-1');
    });
});
