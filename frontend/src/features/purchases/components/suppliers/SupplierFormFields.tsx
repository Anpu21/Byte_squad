import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { SupplierStatus } from '@/types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

export interface SupplierFormValues {
    name: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    creditTermDays: string;
    openingBalance: string;
    status: SupplierStatus;
    notes: string;
}

export type SetSupplierField = <K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
) => void;

/** The supplier header/contact/terms field grid (status shown in edit mode). */
export function SupplierFormFields({
    form,
    set,
    isEdit,
}: {
    form: SupplierFormValues;
    set: SetSupplierField;
    isEdit: boolean;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Supplier name
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Lanka Dairies (Pvt) Ltd"
                    required
                    minLength={2}
                    maxLength={160}
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Contact person
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    value={form.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    maxLength={120}
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Phone
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    maxLength={32}
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Email
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    maxLength={160}
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Address
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                    maxLength={255}
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Credit terms (days)
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    type="number"
                    min="0"
                    max="365"
                    step="1"
                    value={form.creditTermDays}
                    onChange={(e) => set('creditTermDays', e.target.value)}
                    required
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Opening balance
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.openingBalance}
                    onChange={(e) => set('openingBalance', e.target.value)}
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
                        value={form.status}
                        onChange={(e) =>
                            set('status', e.target.value as SupplierStatus)
                        }
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </label>
            )}
        </div>
    );
}
