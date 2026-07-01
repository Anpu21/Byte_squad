import type { ChangeEvent } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { inputClasses } from '../lib/input-classes';
import {
    SUPPORTED_BASE_UNITS_FE,
    isSupportedBaseUnitFe,
} from '../lib/sellable-units';
import type { ProductFormState } from '../hooks/useProductFormState';
import { SellableUnitRow } from './SellableUnitRow';

interface SellableUnitsCardProps {
    form: ProductFormState;
    /**
     * Edit mode renders the full companion-unit editor (the table + "Add unit").
     * Add mode shows only the base-unit picker so creating a product stays
     * simple — managers add pack/companion units later by editing it. The base
     * unit they pick still seeds a valid base sellable-unit row on submit.
     */
    isEditMode: boolean;
}

export function SellableUnitsCard({ form, isEditMode }: SellableUnitsCardProps) {
    function handleBaseUnitChange(e: ChangeEvent<HTMLSelectElement>) {
        const next = e.target.value;
        if (isSupportedBaseUnitFe(next)) {
            form.resetUnitsForBase(next);
        }
    }

    const canRemove = form.units.length > 1;
    const error = form.errors.sellableUnits;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditMode ? 'Sellable units' : 'Unit'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-text-2">
                    {isEditMode
                        ? 'The base unit drives inventory; companion units convert on every sale. Changing the base unit replaces the rows below with the defaults.'
                        : 'Choose how this product is sold and stocked. You can add pack or companion units later by editing the product.'}
                </p>

                {error && (
                    <div
                        role="alert"
                        className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger"
                    >
                        {error}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="product-base-unit"
                        className="block text-xs font-medium text-text-2 mb-1.5"
                    >
                        Base unit
                    </label>
                    <select
                        id="product-base-unit"
                        value={form.baseUnit}
                        onChange={handleBaseUnitChange}
                        className={`${inputClasses(false, 'w-40')} field-select`}
                    >
                        {SUPPORTED_BASE_UNITS_FE.map((u) => (
                            <option key={u} value={u}>
                                {u.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {isEditMode && (
                    <>
                        <div className="rounded-md border border-border-strong overflow-x-auto">
                            <table className="min-w-[760px] w-full text-[12px]">
                                <thead>
                                    <tr className="bg-surface-2 border-b border-border-strong">
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            Name
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            Barcode
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            Base
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            Conversion to base
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            Selling price
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            Order
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-2"
                                        >
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.units.map((row) => (
                                        <SellableUnitRow
                                            key={row.rowId}
                                            row={row}
                                            canRemove={canRemove}
                                            onUpdate={form.updateUnit}
                                            onSetBase={form.setBaseRow}
                                            onRemove={form.removeUnit}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={form.addUnit}
                                className="px-3 py-1.5 rounded-md bg-primary-soft text-primary-soft-text border border-border-strong hover:bg-primary-soft/80 transition-colors text-[12px] font-medium"
                            >
                                + Add unit
                            </button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
