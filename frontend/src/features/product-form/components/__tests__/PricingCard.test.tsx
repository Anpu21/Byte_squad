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
    sellingPriceQty?: string;
    costPriceQty?: string;
    setSellingPriceQty?: (v: string) => void;
    setCostPriceQty?: (v: string) => void;
    errors?: ProductFormState['errors'];
}

const UNIT_UNITS: ISellableUnitRow[] = [
    {
        rowId: 'r-unit',
        name: 'unit',
        barcode: '',
        isBase: true,
        conversionToBase: '1',
        sellingPrice: '',
        displayOrder: 0,
    },
    {
        rowId: 'r-pack',
        name: '12-PACK',
        barcode: '',
        isBase: false,
        conversionToBase: '12',
        sellingPrice: '650',
        displayOrder: 1,
    },
];

function makeForm(overrides: FormOverrides = {}): ProductFormState {
    return {
        sellingPrice: '',
        costPrice: '',
        sellingPriceUnit: 'unit',
        costPriceUnit: 'unit',
        sellingPriceQty: '1',
        costPriceQty: '1',
        units: UNIT_UNITS,
        baseUnit: 'unit',
        setSellingPrice: vi.fn(),
        setCostPrice: vi.fn(),
        setSellingPriceUnit: vi.fn(),
        setCostPriceUnit: vi.fn(),
        setSellingPriceQty: vi.fn(),
        setCostPriceQty: vi.fn(),
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
            /selling price \(LKR\) unit/i,
        ) as HTMLSelectElement;
        const costUnit = screen.getByLabelText(
            /cost price \(LKR\) unit/i,
        ) as HTMLSelectElement;
        expect(sellingUnit.options).toHaveLength(UNIT_UNITS.length);
        expect(costUnit.options).toHaveLength(UNIT_UNITS.length);
        expect(Array.from(sellingUnit.options).map((o) => o.value)).toEqual([
            'unit',
            '12-PACK',
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
            screen.getByLabelText(/selling price \(LKR\) unit/i),
            '12-PACK',
        );
        expect(setSellingPriceUnit).toHaveBeenCalledWith('12-PACK');
    });

    it('shows a per-base preview when entering a pack price', () => {
        render(
            <PricingCard
                form={makeForm({
                    sellingPrice: '650',
                    sellingPriceUnit: '12-PACK',
                })}
                derived={NO_DERIVED}
            />,
        );
        expect(screen.getByText('= Rs 54.17 / unit')).toBeInTheDocument();
    });

    it('divides by the basis quantity and previews the per-1-kg price', () => {
        const KG_UNITS: ISellableUnitRow[] = [
            {
                rowId: 'r-kg',
                name: 'kg',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
        ];
        render(
            <PricingCard
                form={makeForm({
                    units: KG_UNITS,
                    baseUnit: 'kg',
                    sellingPrice: '200',
                    sellingPriceUnit: 'kg',
                    sellingPriceQty: '0.5',
                    costPriceUnit: 'kg',
                })}
                derived={NO_DERIVED}
            />,
        );
        // 200 entered for 0.5 kg → Rs 400 per 1 kg (the stored base price).
        expect(screen.getByText('= Rs 400.00 / kg')).toBeInTheDocument();
    });

    it('shows "per unit" caption (no math) when the chosen unit IS the base', () => {
        render(
            <PricingCard
                form={makeForm({
                    sellingPrice: '60',
                    sellingPriceUnit: 'unit',
                })}
                derived={NO_DERIVED}
            />,
        );
        // Scope to <p> captions so the assertion does not match the
        // "per unit" option text inside the unit <select>. Both price fields
        // default to unit in the test form so both render the static
        // caption — that's why we expect 2.
        const captions = screen.getAllByText('per unit', { selector: 'p' });
        expect(captions).toHaveLength(2);
    });

    it('hides the normalized preview when the price input is empty and unit is not base', () => {
        render(
            <PricingCard
                form={makeForm({
                    sellingPrice: '',
                    sellingPriceUnit: '12-PACK',
                    costPrice: '',
                    costPriceUnit: '12-PACK',
                })}
                derived={NO_DERIVED}
            />,
        );
        // No "= Rs … / unit" text should appear when both inputs are empty
        // and the chosen unit is a non-base companion.
        expect(screen.queryByText(/= Rs/i)).not.toBeInTheDocument();
        // The static "per unit" caption should also be absent because the
        // current unit is 12-PACK, not the base unit. Scope the selector to the
        // preview <p> so we don't match "per unit" inside the <option> list
        // in the unit <select>.
        const previewCaptions = screen.queryAllByText(/per unit/i, {
            selector: 'p',
        });
        expect(previewCaptions).toHaveLength(0);
    });
});
