import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { ProfileField } from './ProfileField';
import { PROFILE_INPUT_CLASS } from '../lib/input-classes';

interface PasswordChangeFormProps {
    currentPassword: string;
    setCurrentPassword: (v: string) => void;
    newPassword: string;
    setNewPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    error: string | null;
    submitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function PasswordChangeForm({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    submitting,
    onSubmit,
}: PasswordChangeFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="bg-surface border border-border rounded-md overflow-hidden"
        >
            <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                <ShieldCheck size={15} className="text-text-2" />
                <h2 className="text-sm font-semibold text-text-1">Security</h2>
            </header>
            <div className="p-6 space-y-5">
                {error && (
                    <div className="flex items-start gap-2 rounded-md bg-danger-soft border border-danger/40 px-3 py-2 text-[12.5px] text-danger">
                        <AlertCircle
                            size={14}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{error}</span>
                    </div>
                )}
                <ProfileField label="Current password">
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className={PROFILE_INPUT_CLASS}
                        placeholder="••••••••"
                    />
                </ProfileField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <ProfileField label="New password" hint="At least 8 characters">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            className={PROFILE_INPUT_CLASS}
                        />
                    </ProfileField>
                    <ProfileField label="Confirm new password">
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            required
                            className={PROFILE_INPUT_CLASS}
                        />
                    </ProfileField>
                </div>
            </div>
            <footer className="px-6 py-4 border-t border-border bg-surface-2 flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border-strong bg-surface text-sm font-medium text-text-1 hover:bg-surface-2 transition-colors disabled:opacity-60"
                >
                    {submitting ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Updating…
                        </>
                    ) : (
                        'Update password'
                    )}
                </button>
            </footer>
        </form>
    );
}
