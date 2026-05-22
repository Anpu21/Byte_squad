interface AdminPersonalInfoFormProps {
    firstName: string;
    setFirstName: (v: string) => void;
    lastName: string;
    setLastName: (v: string) => void;
    email: string | undefined;
    role: string | undefined;
    isSubmitting: boolean;
    onSave: () => void;
}

const INPUT_CLASS =
    'w-full h-11 px-4 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all';
const DISABLED_INPUT_CLASS =
    'w-full h-11 px-4 bg-canvas border border-border rounded-xl text-sm text-text-3 outline-none cursor-not-allowed';
const LABEL_CLASS =
    'block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]';

export function AdminPersonalInfoForm({
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    role,
    isSubmitting,
    onSave,
}: AdminPersonalInfoFormProps) {
    const formattedRole = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : '';

    return (
        <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-2">
                <h3 className="text-base font-semibold text-text-1 tracking-tight">
                    Personal Information
                </h3>
                <p className="text-xs text-text-2 mt-1">
                    Update your name. Email and role are managed by your administrator.
                </p>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className={LABEL_CLASS}>First Name</label>
                        <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Last Name</label>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Email Address</label>
                        <input
                            value={email ?? ''}
                            disabled
                            className={DISABLED_INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Role</label>
                        <input
                            value={formattedRole}
                            disabled
                            className={`${DISABLED_INPUT_CLASS} capitalize`}
                        />
                    </div>
                </div>
            </div>
            <div className="p-5 border-t border-border bg-surface-2 flex justify-end">
                <button
                    onClick={onSave}
                    disabled={isSubmitting}
                    className="h-9 px-5 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
