interface AdminPasswordCardProps {
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

const INPUT_CLASS =
    'w-full h-11 px-4 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3';
const LABEL_CLASS =
    'block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]';

export function AdminPasswordCard({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    submitting,
    onSubmit,
}: AdminPasswordCardProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden"
        >
            <div className="p-6 border-b border-border bg-surface-2">
                <h3 className="text-base font-semibold text-text-1 tracking-tight">
                    Security
                </h3>
                <p className="text-xs text-text-2 mt-1">
                    Update your password to keep your account secure.
                </p>
            </div>
            <div className="p-6 space-y-6">
                {error && (
                    <div className="bg-danger-soft border border-danger/30 rounded-lg p-3">
                        <p className="text-danger text-sm">{error}</p>
                    </div>
                )}
                <div>
                    <label className={LABEL_CLASS}>Current Password</label>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className={INPUT_CLASS}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className={LABEL_CLASS}>New Password</label>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="Min 8 characters"
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Confirm Password</label>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter password"
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>
            </div>
            <div className="p-5 border-t border-border bg-surface-2 flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="h-9 px-5 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
    );
}
