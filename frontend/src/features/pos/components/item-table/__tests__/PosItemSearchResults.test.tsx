import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ISearchProductRow } from '@/types';
import { PosItemSearchResults } from '../PosItemSearchResults';

const sampleRow: ISearchProductRow = {
    productId: 'p-1',
    productCode: 'PC-001',
    productName: 'Basmati Rice 5kg',
    productType: 'Grocery',
    baseUnit: 'kg',
    status: true,
    costPrice: 800,
    retailPrice: 1200,
    taxRate: 0,
    discountAllowed: true,
    imageUrl: null,
};

describe('PosItemSearchResults', () => {
    it('renders nothing when the query is empty', () => {
        const { container } = render(
            <PosItemSearchResults
                results={[sampleRow]}
                onSelect={vi.fn()}
                query=""
            />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders the result row with the product retail price', () => {
        render(
            <PosItemSearchResults
                results={[sampleRow]}
                onSelect={vi.fn()}
                query="rice"
            />,
        );
        expect(screen.getByText('Basmati Rice 5kg')).toBeInTheDocument();
        expect(screen.getByText('PC-001')).toBeInTheDocument();
        // Retail (LKR 1,200.00) is the only price now that the
        // wholesale tier was removed from the cashier UI.
        expect(
            screen.getByText((text) => /LKR\s*1,200\.00/.test(text)),
        ).toBeInTheDocument();
    });

    it('calls onSelect with the row when a result is clicked', async () => {
        const onSelect = vi.fn();
        render(
            <PosItemSearchResults
                results={[sampleRow]}
                onSelect={onSelect}
                query="rice"
            />,
        );
        // The clickable surface is the button inside the option <li>.
        await userEvent.click(screen.getByRole('button'));
        expect(onSelect).toHaveBeenCalledWith(sampleRow);
    });

    it('shows the empty-result hint when results is empty', () => {
        render(
            <PosItemSearchResults
                results={[]}
                onSelect={vi.fn()}
                query="zzz"
            />,
        );
        expect(screen.getByText(/No products match/i)).toBeInTheDocument();
    });

    it('shows the loading hint when isLoading', () => {
        render(
            <PosItemSearchResults
                results={[]}
                onSelect={vi.fn()}
                isLoading
                query="rice"
            />,
        );
        expect(screen.getByText(/Searching products/i)).toBeInTheDocument();
    });
});
