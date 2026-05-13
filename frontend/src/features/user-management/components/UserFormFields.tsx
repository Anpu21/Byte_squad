import { UserRole } from '@/constants/enums';
import type { IBranch } from '@/types';
import type { UserFormState } from './user-form.helpers';
import { STAFF_ROLES } from './user-form.helpers';

const INPUT_CLASS =
    'w-full h-9 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 transition-colors';

const LABEL_CLASS =
    'block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5';

interface UserFormFieldsProps {
    form: UserFormState;
    branches: IBranch[];
    isEdit: boolean;
    onChange: <K extends keyof UserFormState>(
        key: K,
        value: UserFormState[K],
    ) => void;
}

export function UserFormFields({
    form,
    branches,
    isEdit,
    onChange,
}: UserFormFieldsProps) {
    const roleOptions = isEdit
        ? [...STAFF_ROLES, UserRole.CUSTOMER]
        : STAFF_ROLES;
    const isCustomer = form.role === UserRole.CUSTOMER;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="uf-first-name" className={LABEL_CLASS}>
                        First name
                    </label>
                    <input
                        id="uf-first-name"
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        className={INPUT_CLASS}
                    />
                </div>
                <div>
                    <label htmlFor="uf-last-name" className={LABEL_CLASS}>
                        Last name
                    </label>
                    <input
                        id="uf-last-name"
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        className={INPUT_CLASS}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="uf-email" className={LABEL_CLASS}>
                        Email
                    </label>
                    <input
                        id="uf-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        placeholder="user@company.com"
                        className={INPUT_CLASS}
                    />
                </div>
                <div>
                    <label htmlFor="uf-phone" className={LABEL_CLASS}>
                        Phone
                    </label>
                    <input
                        id="uf-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        placeholder="+94 77 123 4567"
                        className={INPUT_CLASS}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="uf-role" className={LABEL_CLASS}>
                        Role
                    </label>
                    <select
                        id="uf-role"
                        value={form.role}
                        onChange={(e) =>
                            onChange('role', e.target.value as UserRole)
                        }
                        className={`${INPUT_CLASS} cursor-pointer`}
                    >
                        {roleOptions.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="uf-branch" className={LABEL_CLASS}>
                        Branch
                    </label>
                    <select
                        id="uf-branch"
                        value={form.branchId}
                        onChange={(e) => onChange('branchId', e.target.value)}
                        required={!isCustomer}
                        className={`${INPUT_CLASS} cursor-pointer`}
                    >
                        {isCustomer && (
                            <option value="">(No branch)</option>
                        )}
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="uf-address" className={LABEL_CLASS}>
                    Address
                </label>
                <textarea
                    id="uf-address"
                    rows={3}
                    value={form.address}
                    onChange={(e) => onChange('address', e.target.value)}
                    placeholder="Optional. Mailing or delivery address."
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 transition-colors resize-y"
                />
            </div>
        </div>
    );
}
