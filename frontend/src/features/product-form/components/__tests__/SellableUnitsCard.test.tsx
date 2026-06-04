import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SellableUnitsCard } from '../SellableUnitsCard';
import type { ProductFormState } from '../../hooks/useProductFormState';
import type { ISellableUnitRow } from '../../types/sellable-unit-row.type';
import type { TBaseUnitFe } from '../../lib/sellable-units';

function makeForm(
    units: ISellableUnitRow[],
    baseUnit: TBaseUnitFe = 'unit',
    overrides: Partial<ProductFormState> = {},
): ProductFormState {
    return {
        baseUnit,
        setBaseUnit: vi.fn(),
        units,
        setUnits: vi.fn(),
        resetUnitsForBase: vi.fn(),
        addUnit: vi.fn(),
        updateUnit: vi.fn(),
        removeUnit: vi.fn(),
        setBaseRow: vi.fn(),
        errors: {},
        ...overrides,
    } as unknown as ProductFormState;
}

describe('SellableUnitsCard', () => {
    it('renders the baseUnit select with the supported stock units', () => {
        render(<SellableUnitsCard form={makeForm([])} />);
        const select = screen.getByLabelText(/base unit/i) as HTMLSelectElement;
        expect(select.options).toHaveLength(3);
    });

    it('selecting a baseUnit calls resetUnitsForBase', async () => {
        const form = makeForm([], 'unit');
        render(<SellableUnitsCard form={form} />);
        await userEvent.selectOptions(
            screen.getByLabelText(/base unit/i),
            'kg',
        );
        expect(form.resetUnitsForBase).toHaveBeenCalledWith('kg');
    });

    it('renders one row per unit with its name and conversion', () => {
        const units: ISellableUnitRow[] = [
            {
                rowId: 'r1',
                name: 'kg',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
            {
                rowId: 'r2',
                name: '12-PACK',
                barcode: 'RICE-12',
                isBase: false,
                conversionToBase: '12',
                sellingPrice: '2200',
                displayOrder: 1,
            },
        ];
        render(<SellableUnitsCard form={makeForm(units, 'kg')} />);
        // +1 header row
        expect(screen.getAllByRole('row')).toHaveLength(units.length + 1);
        // The name 'kg' shows up in both the base-unit <select> and the first
        // row's name <input>, so scope to the name inputs to disambiguate.
        const nameInputs = screen.getAllByLabelText(/unit name/i);
        expect(nameInputs).toHaveLength(2);
        expect((nameInputs[0] as HTMLInputElement).value).toBe('kg');
        expect((nameInputs[1] as HTMLInputElement).value).toBe('12-PACK');
        expect(screen.getByDisplayValue('12')).toBeInTheDocument();
        expect(screen.getByDisplayValue('RICE-12')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2200')).toBeInTheDocument();
    });

    it('clicking "Add unit" calls form.addUnit', async () => {
        const form = makeForm([], 'unit');
        render(<SellableUnitsCard form={form} />);
        await userEvent.click(
            screen.getByRole('button', { name: /add unit/i }),
        );
        expect(form.addUnit).toHaveBeenCalledTimes(1);
    });

    it('changing the isBase radio for row 2 calls setBaseRow with its rowId', async () => {
        const units: ISellableUnitRow[] = [
            {
                rowId: 'r1',
                name: 'kg',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
            {
                rowId: 'r2',
                name: '12-PACK',
                barcode: 'RICE-12',
                isBase: false,
                conversionToBase: '12',
                sellingPrice: '2200',
                displayOrder: 1,
            },
        ];
        const form = makeForm(units, 'kg');
        render(<SellableUnitsCard form={form} />);
        const radios = screen.getAllByRole('radio');
        await userEvent.click(radios[1]);
        expect(form.setBaseRow).toHaveBeenCalledWith('r2');
    });

    it('clicking remove on a row calls form.removeUnit with its rowId', async () => {
        const units: ISellableUnitRow[] = [
            {
                rowId: 'r1',
                name: 'kg',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
            {
                rowId: 'r2',
                name: '12-PACK',
                barcode: 'RICE-12',
                isBase: false,
                conversionToBase: '12',
                sellingPrice: '2200',
                displayOrder: 1,
            },
        ];
        const form = makeForm(units, 'kg');
        render(<SellableUnitsCard form={form} />);
        const removeButtons = screen.getAllByRole('button', { name: /remove/i });
        await userEvent.click(removeButtons[1]);
        expect(form.removeUnit).toHaveBeenCalledWith('r2');
    });

    it('shows the sellableUnits form-error message when present', () => {
        const form = makeForm([], 'unit', {
            errors: { sellableUnits: 'Duplicate unit name: kg' },
        });
        render(<SellableUnitsCard form={form} />);
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/duplicate unit name: kg/i);
    });

    it('rejects a non-decimal keystroke on the conversion-factor field', async () => {
        const units: ISellableUnitRow[] = [
            {
                rowId: 'r1',
                name: 'kg',
                barcode: '',
                isBase: false,
                conversionToBase: '1',
                sellingPrice: '100',
                displayOrder: 0,
            },
        ];
        const form = makeForm(units, 'kg');
        render(<SellableUnitsCard form={form} />);
        const conversionInput = screen.getByDisplayValue('1');
        await userEvent.type(conversionInput, 'abc');
        expect(form.updateUnit).not.toHaveBeenCalled();
    });
});
