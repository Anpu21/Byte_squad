import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (currentPassword === newPassword) {
            setError('New password must be different from the temporary password');
            return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success('Password changed successfully! Please log in with your new password.');
            logout();
            navigate(FRONTEND_ROUTES.LOGIN);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to change password');
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase =
        'w-full h-[42px] px-3 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 placeholder:text-text-3 transition-colors';

    const strength = (() => {
        let s = 0;
        if (newPassword.length >= 8) s++;
        if (newPassword.length >= 12) s++;
        if (/[A-Z]/.test(newPassword)) s++;
        if (/[0-9]/.test(newPassword)) s++;
        if (/[^A-Za-z0-9]/.test(newPassword)) s++;
        return s;
    })();
    const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'][strength];
    const strengthPct = (Math.max(strength, 1) / 5) * 100;
    const strengthColor =
        strength <= 1 ? 'var(--danger)' : strength <= 3 ? 'var(--warning)' : 'var(--accent)';

    return (
        <div className="min-h-screen bg-canvas text-text-1 font-sans flex items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Set a new password</CardTitle>
                            <CardDescription>
                                You&apos;re logging in for the first time. Please set a permanent password to continue.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {error && (
                                <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Temporary password
                                </label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder="Enter your temporary password"
                                        className={inputBase + ' pl-9'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    New password
                                </label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="Minimum 8 characters"
                                        className={inputBase + ' pl-9'}
                                    />
                                </div>
                                {newPassword && (
                                    <>
                                        <div className="h-1.5 bg-surface-2 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${strengthPct}%`,
                                                    background: strengthColor,
                                                }}
                                            />
                                        </div>
                                        <p
                                            className="text-xs mt-1 font-medium"
                                            style={{ color: strengthColor }}
                                        >
                                            {strengthLabel}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Confirm new password
                                </label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Re-enter your new password"
                                        className={inputBase + ' pl-9'}
                                    />
                                </div>
                            </div>

                            <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-2">
                                {isLoading ? 'Changing password…' : 'Update password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
