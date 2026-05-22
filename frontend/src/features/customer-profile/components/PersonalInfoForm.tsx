import { Check, Loader2, UserRound } from 'lucide-react';
import { ProfileField } from './ProfileField';
import { PROFILE_INPUT_CLASS } from '../lib/input-classes';

interface PersonalInfoFormProps {
    firstName: string;
    setFirstName: (v: string) => void;
    lastName: string;
    setLastName: (v: string) => void;
    email: string | undefined;
    phone: string;
    setPhone: (v: string) => void;
    phoneError?: string;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function PersonalInfoForm({
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    phone,
    setPhone,
    phoneError,
    isSubmitting,
    onSubmit,
}: PersonalInfoFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="bg-surface border border-border rounded-md overflow-hidden"
        >
            <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                <UserRound size={15} className="text-text-2" />
                <h2 className="text-sm font-semibold text-text-1">Personal info</h2>
            </header>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ProfileField label="First name">
                    <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={PROFILE_INPUT_CLASS}
                    />
                </ProfileField>
                <ProfileField label="Last name">
                    <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={PROFILE_INPUT_CLASS}
                    />
                </ProfileField>
                <ProfileField label="Email" hint="Managed by your account">
                    <input
                        value={email ?? ''}
                        disabled
                        className={`${PROFILE_INPUT_CLASS} text-text-3 cursor-not-allowed`}
                    />
                </ProfileField>
                <ProfileField label="Phone">
                    <input
                        type="tel"
                        inputMode="tel"
                        maxLength={16}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 77 123 4567"
                        aria-invalid={!!phoneError}
                        className={`${PROFILE_INPUT_CLASS}${phoneError ? ' border-danger focus:border-danger focus:ring-danger/30' : ''}`}
                    />
                    {phoneError && (
                        <span className="block text-[10.5px] text-danger mt-1">
                            {phoneError}
                        </span>
                    )}
                </ProfileField>
            </div>
            <footer className="px-6 py-4 border-t border-border bg-surface-2 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-text-inv text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>
                            <Check size={14} />
                            Save changes
                        </>
                    )}
                </button>
            </footer>
        </form>
    );
}
