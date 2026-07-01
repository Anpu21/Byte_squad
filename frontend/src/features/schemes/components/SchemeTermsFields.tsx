import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { SchemeFormValues, SetSchemeField } from './scheme-form.types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface SchemeTermsFieldsProps {
    form: SchemeFormValues;
    set: SetSchemeField;
    isEdit: boolean;
}

/** Minimum quantity, discount %, active window, and status for a scheme. */
export function SchemeTermsFields({ form, set, isEdit }: SchemeTermsFieldsProps) {
    return (
        <>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Minimum quantity (0 = always)
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    type="number"
                    min="0"
                    step="any"
                    value={form.minQty}
                    onChange={(e) => set('minQty', e.target.value)}
                    required
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Discount %
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={form.discountPercentage}
                    onChange={(e) => set('discountPercentage', e.target.value)}
                    required
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Starts
                </span>
                <input
                    className={`${INPUT_CLASS} w-full${form.startDate ? '' : ' date-empty'}`}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    required
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Ends
                </span>
                <input
                    className={`${INPUT_CLASS} w-full${form.endDate ? '' : ' date-empty'}`}
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    required
                />
            </label>
            {isEdit && (
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Status
                    </span>
                    <select
                        className={`${INPUT_CLASS} field-select w-full`}
                        value={form.isActive ? 'active' : 'paused'}
                        onChange={(e) =>
                            set('isActive', e.target.value === 'active')
                        }
                    >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                    </select>
                </label>
            )}
        </>
    );
}
