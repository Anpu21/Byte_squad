import Input from '@/components/ui/Input';

export interface BranchFormState {
    code: string;
    name: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    email: string;
}

interface BranchFormFieldsProps {
    form: BranchFormState;
    onChange: <K extends keyof BranchFormState>(
        key: K,
        value: BranchFormState[K],
    ) => void;
}

const SECTION_TITLE_CLASS =
    'text-[11px] uppercase tracking-widest text-text-2 font-semibold pb-2 border-b border-border';

export function BranchFormFields({ form, onChange }: BranchFormFieldsProps) {
    return (
        <>
            <section className="space-y-3">
                <h3 className={SECTION_TITLE_CLASS}>Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Branch Code"
                        required
                        placeholder="BR001"
                        value={form.code}
                        onChange={(e) =>
                            onChange('code', e.target.value.toUpperCase())
                        }
                        className="font-mono uppercase"
                    />
                    <Input
                        label="Branch Name"
                        required
                        value={form.name}
                        onChange={(e) => onChange('name', e.target.value)}
                    />
                </div>
                <p className="text-[11px] text-text-3">
                    Short unique code — e.g. BR001
                </p>
            </section>

            <section className="space-y-3">
                <h3 className={SECTION_TITLE_CLASS}>Address</h3>
                <Input
                    label="Address Line 1"
                    required
                    value={form.addressLine1}
                    onChange={(e) => onChange('addressLine1', e.target.value)}
                />
                <Input
                    label="Address Line 2"
                    value={form.addressLine2}
                    onChange={(e) => onChange('addressLine2', e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="City"
                        value={form.city}
                        onChange={(e) => onChange('city', e.target.value)}
                    />
                    <Input
                        label="State / Province"
                        value={form.state}
                        onChange={(e) => onChange('state', e.target.value)}
                    />
                    <Input
                        label="Country"
                        value={form.country}
                        onChange={(e) => onChange('country', e.target.value)}
                    />
                    <Input
                        label="Postal Code"
                        value={form.postalCode}
                        onChange={(e) => onChange('postalCode', e.target.value)}
                    />
                </div>
            </section>

            <section className="space-y-3">
                <h3 className={SECTION_TITLE_CLASS}>Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Phone"
                        value={form.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => onChange('email', e.target.value)}
                    />
                </div>
            </section>
        </>
    );
}
