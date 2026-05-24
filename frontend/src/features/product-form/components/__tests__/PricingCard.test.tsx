import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PricingCard } from '../PricingCard';
import type { ProductFormState } from '../../hooks/useProductFormState';
import type { ISellableUnitRow } from '../../types/sellable-unit-row.type';
import type { TBaseUnitFe } from '../../lib/sellable-units';
import type { PriceDerived } from '../../lib/price-math';

interface FormOverrides {
    sellingPrice?: string;
    costPrice?: string;
    sellingPriceUnit?: string;
    costPriceUnit?: string;
    units?: ISellableUnitRow[];
    baseUnit?: TBaseUnitFe;
    setSellingPrice?: (v: string) => void;
    setCostPrice?: (v: string) => void;
    setSellingPriceUnit?: (v: string) => void;
    setCostPriceUnit?: (v: string) => void;
    errors?: ProductFormState['errors'];
}

const KG_UNITS: ISellableUnitRow[] = [
    {
        rowId: 'r-kg',
        name: 'kg',
        isBase: true,
        conversionToBase: '1',
        displayOrder: 0,
    },
    {
        rowId: 'r-g',
        name: 'g',
        isBase: false,
        conversionToBase: '0.001',
        displayOrder: 1,
    },
];

function makeForm(overrides: FormOverrides = {}): ProductFormState {
    return {
        sellingPrice: '',
        costPrice: '',
        sellingPriceUnit: 'kg',
        costPriceUnit: 'kg',
        units: KG_UNITS,
        baseUnit: 'kg',
        setSellingPrice: vi.fn(),
        setCostPrice: vi.fn(),
        setSellingPriceUnit: vi.fn(),
        setCostPriceUnit: vi.fn(),
        errors: {},
        ...overrides,
    } as unknown as ProductFormState;
}

const NO_DERIVED: PriceDerived = {
    marginPct: null,
    markupPct: null,
    profitAbs: null,
};

describe('PricingCard — per-unit price entry', () => {
    it('renders a unit select beside each price input populated from form.units', () => {
        render(<PricingCard form={makeForm()} derived={NO_DERIVED} />);
        const sellingUnit = screen.getByLabelText(
            /selling price \(LKR\) per/i,
        ) as HTMLSelectElement;
        const costUnit = screen.getByLabelText(
            /cost price \(LKR\) per/i,
        ) as HTMLSelectElement;
        expect(sellingUnit.options).toHaveLength(KG_UNITS.length);
        expect(costUnit.options).toHaveLength(KG_UNITS.length);
        expect(Array.from(sellingUnit.options).map((o) => o.value)).toEqual([
            'kg',
            'g',
        ]);
    });

    it('changing the selling-price unit calls form.setSellingPriceUnit', async () => {
        const setSellingPriceUnit = vi.fn();
        render(
            <PricingCard
                form={makeForm({ setSellingPriceUnit })}
                derived={NO_DERIVED}
            />,
        );
        await userEvent.selectOptions(
            screen.getByLabelText(/selling price \(LKR\) per/i),
            'g',
        );
        expect(setSellingPriceUnit).toHaveBeenCalledWith('g');
    });

    it('shows "= Rs 500.00 / kg" preview when entering 0.5 in g for a kg-based product', () => {
        render(
            <PricingCard
                form={makeForm({
                    sellingPrice: '0.5',
                    sellingPriceUnit: 'g',
                })}
                derived={NO_DERIVED}
            />,
        );
        expect(screen.getByText('= Rs 500.00 / kg')).toBeInTheDocument();
    });

    it('shows "per kg" caption (no math) when the chosen unit IS the base', () => {
        render(
            <PricingCard
                form={makeForm({
                    sellingPrice: '500',
                    sellingPriceUnit: 'kg',
                })}
                derived={NO_DERIVED}
            />,
        );
        // Scope to <p> captions so the assertion does not match the
        // "per kg" option text inside the unit <select>. Both price fields
        // default to kg in the test form so both render the static
        // caption — that's why we expect 2.
        const captions = screen.getAllByText('per kg', { selector: 'p' });
        expect(captions).toHaveLength(2);
    });

    it('hides the normalized preview when the price input is empty and unit is not base', () => {
        render(
            <PricingCard
                form={makeForm({
                    sellingPrice: '',
                    sellingPriceUnit: 'g',
                    costPrice: '',
                    costPriceUnit: 'g',
                })}
                derived={NO_DERIVED}
            />,
        );
        // No "= Rs … / kg" text should appear when both inputs are empty
        // and the chosen unit is a non-base companion.
        expect(screen.queryByText(/= Rs/i)).not.toBeInTheDocument();
        // The static "per kg" caption should also be absent because the
        // current unit is g, not the base kg. Scope the selector to the
        // preview <p> so we don't match "per kg" inside the <option> list
        // in the unit <select>.
        const previewCaptions = screen.queryAllByText(/per kg/i, {
            selector: 'p',
        });
        expect(previewCaptions).toHaveLength(0);
    });
});
