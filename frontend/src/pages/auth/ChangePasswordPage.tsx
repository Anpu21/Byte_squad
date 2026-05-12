import { Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card, {
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useChangePasswordPage } from '@/features/change-password/hooks/useChangePasswordPage';
import { PasswordStrengthMeter } from '@/features/change-password/components/PasswordStrengthMeter';

export function ChangePasswordPage() {
    const p = useChangePasswordPage();

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
                                You&apos;re logging in for the first time.
                                Please set a permanent password to continue.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form
                            onSubmit={p.handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            {p.error && (
                                <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium">
                                    {p.error}
                                </div>
                            )}

                            <Input
                                label="Temporary password"
                                type="password"
                                value={p.currentPassword}
                                onChange={(e) =>
                                    p.setCurrentPassword(e.target.value)
                                }
                                required
                                placeholder="Enter your temporary password"
                                leftIcon={<Lock size={14} />}
                                sizeVariant="lg"
                            />

                            <div>
                                <Input
                                    label="New password"
                                    type="password"
                                    value={p.newPassword}
                                    onChange={(e) =>
                                        p.setNewPassword(e.target.value)
                                    }
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    leftIcon={<Lock size={14} />}
                                    sizeVariant="lg"
                                />
                                <PasswordStrengthMeter
                                    password={p.newPassword}
                                />
                            </div>

                            <Input
                                label="Confirm new password"
                                type="password"
                                value={p.confirmPassword}
                                onChange={(e) =>
                                    p.setConfirmPassword(e.target.value)
                                }
                                required
                                placeholder="Re-enter your new password"
                                leftIcon={<Lock size={14} />}
                                sizeVariant="lg"
                            />

                            <Button
                                type="submit"
                                size="lg"
                                disabled={p.isLoading}
                                className="w-full mt-2"
                            >
                                {p.isLoading
                                    ? 'Changing password…'
                                    : 'Update password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
