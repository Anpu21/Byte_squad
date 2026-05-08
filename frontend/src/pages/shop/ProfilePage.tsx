import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    Camera,
    Check,
    ChevronRight,
    Loader2,
    MapPin,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { profileService } from '@/services/profile.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { setUser } from '@/store/slices/authSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Avatar from '@/components/ui/Avatar';
import type { IUserProfile } from '@/types';

export default function CustomerProfilePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: profile, isLoading } = useQuery<IUserProfile>({
        queryKey: ['profile'],
        queryFn: profileService.getProfile,
    });

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (profile && !hydrated) {
            setFirstName(profile.firstName);
            setLastName(profile.lastName);
            setPhone(profile.phone ?? '');
            setHydrated(true);
        }
    }, [profile, hydrated]);

    const updateProfileMutation = useMutation({
        mutationFn: (data: {
            firstName: string;
            lastName: string;
            phone: string | null;
        }) => profileService.updateProfile(data),
        onSuccess: (next) => {
            queryClient.setQueryData(['profile'], next);
            dispatch(
                setUser({
                    firstName: next.firstName,
                    lastName: next.lastName,
                    phone: next.phone,
                }),
            );
            toast.success('Profile updated');
        },
        onError: () => toast.error('Could not update profile'),
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => profileService.uploadAvatar(file),
        onSuccess: (next) => {
            queryClient.setQueryData(['profile'], next);
            dispatch(setUser({ avatarUrl: next.avatarUrl }));
            toast.success('Avatar updated');
        },
        onError: () =>
            toast.error('Could not upload avatar. Max 2MB, images only.'),
    });

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSubmitting, setPwSubmitting] = useState(false);

    const handlePersonalSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPhone = phone.trim();
        updateProfileMutation.mutate({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: trimmedPhone.length > 0 ? trimmedPhone : null,
        });
    };

    const handleAvatarPick = () => fileInputRef.current?.click();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        avatarMutation.mutate(file);
        e.target.value = '';
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError(null);

        if (newPassword.length < 8) {
            setPwError('New password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError('Passwords do not match');
            return;
        }

        setPwSubmitting(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success('Password updated');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                setPwError(data?.message ?? 'Failed to change password');
            } else {
                setPwError('An unexpected error occurred');
            }
        } finally {
            setPwSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-text-3" size={28} />
            </div>
        );
    }

    const displayName = profile
        ? `${profile.firstName} ${profile.lastName}`
        : user
          ? `${user.firstName} ${user.lastName}`
          : '';

    const avatarSrc = profile?.avatarUrl ?? user?.avatarUrl ?? undefined;
    const branch = profile?.branch;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[2px] text-text-3">
                    Account
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-text-1 mt-1">
                    Profile
                </h1>
                <p className="text-sm text-text-2 mt-1.5">
                    Manage your account details, branch and password.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
                {/* Avatar column */}
                <aside className="lg:sticky lg:top-24 self-start">
                    <div className="bg-surface border border-border rounded-md p-6 flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <Avatar
                                name={displayName}
                                src={avatarSrc}
                                size={120}
                                className="ring-4 ring-surface-2"
                            />
                            <button
                                type="button"
                                onClick={handleAvatarPick}
                                disabled={avatarMutation.isPending}
                                className="absolute bottom-1 right-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-text-inv border-2 border-surface shadow-md-token hover:bg-primary-hover transition-colors disabled:opacity-60"
                                aria-label="Change avatar"
                            >
                                {avatarMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Camera size={14} />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <p className="text-base font-semibold text-text-1 truncate max-w-full">
                            {displayName}
                        </p>
                        <p className="text-xs text-text-2 mt-1 truncate max-w-full">
                            {profile?.email}
                        </p>
                        <button
                            type="button"
                            onClick={handleAvatarPick}
                            disabled={avatarMutation.isPending}
                            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-text-2 hover:text-text-1 transition-colors disabled:opacity-60"
                        >
                            <Camera size={12} />
                            Upload photo
                        </button>
                        <p className="mt-2 text-[10.5px] text-text-3">
                            JPG, PNG or WebP · max 2MB
                        </p>
                    </div>
                </aside>

                {/* Form columns */}
                <div className="space-y-6">
                    {/* Personal info */}
                    <form
                        onSubmit={handlePersonalSave}
                        className="bg-surface border border-border rounded-md overflow-hidden"
                    >
                        <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                            <UserRound size={15} className="text-text-2" />
                            <h2 className="text-sm font-semibold text-text-1">
                                Personal info
                            </h2>
                        </header>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Field label="First name">
                                <input
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    required
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Last name">
                                <input
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    required
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Email" hint="Managed by your account">
                                <input
                                    value={profile?.email ?? ''}
                                    disabled
                                    className={`${inputClass} text-text-3 cursor-not-allowed`}
                                />
                            </Field>
                            <Field label="Phone">
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+94 7X XXX XXXX"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <footer className="px-6 py-4 border-t border-border bg-surface-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-text-inv text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
                            >
                                {updateProfileMutation.isPending ? (
                                    <>
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
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

                    {/* Branch */}
                    <section className="bg-surface border border-border rounded-md overflow-hidden">
                        <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                            <MapPin size={15} className="text-text-2" />
                            <h2 className="text-sm font-semibold text-text-1">
                                Pickup branch
                            </h2>
                        </header>
                        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="min-w-0">
                                {branch ? (
                                    <>
                                        <p className="text-base font-semibold text-text-1 truncate">
                                            {branch.name}
                                        </p>
                                        {branch.address && (
                                            <p className="text-xs text-text-2 mt-1">
                                                {branch.address}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-text-1">
                                            No branch selected
                                        </p>
                                        <p className="text-xs text-text-2 mt-1">
                                            Pick a branch to start placing
                                            pickup orders.
                                        </p>
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(FRONTEND_ROUTES.SELECT_BRANCH)
                                }
                                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border-strong text-sm font-medium text-text-1 bg-surface hover:bg-surface-2 transition-colors"
                            >
                                {branch ? 'Change branch' : 'Select branch'}
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </section>

                    {/* Security */}
                    <form
                        onSubmit={handlePasswordSave}
                        className="bg-surface border border-border rounded-md overflow-hidden"
                    >
                        <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                            <ShieldCheck size={15} className="text-text-2" />
                            <h2 className="text-sm font-semibold text-text-1">
                                Security
                            </h2>
                        </header>
                        <div className="p-6 space-y-5">
                            {pwError && (
                                <div className="flex items-start gap-2 rounded-md bg-danger-soft border border-danger/40 px-3 py-2 text-[12.5px] text-danger">
                                    <AlertCircle
                                        size={14}
                                        className="mt-0.5 flex-shrink-0"
                                    />
                                    <span>{pwError}</span>
                                </div>
                            )}
                            <Field label="Current password">
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    required
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </Field>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field
                                    label="New password"
                                    hint="At least 8 characters"
                                >
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Confirm new password">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        className={inputClass}
                                    />
                                </Field>
                            </div>
                        </div>
                        <footer className="px-6 py-4 border-t border-border bg-surface-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={pwSubmitting}
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border-strong bg-surface text-sm font-medium text-text-1 hover:bg-surface-2 transition-colors disabled:opacity-60"
                            >
                                {pwSubmitting ? (
                                    <>
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                        Updating…
                                    </>
                                ) : (
                                    'Update password'
                                )}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        </div>
    );
}

const inputClass =
    'w-full h-10 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-text-3 disabled:bg-surface-2';

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold text-text-2 uppercase tracking-[1px] mb-1.5">
                {label}
            </span>
            {children}
            {hint && (
                <span className="block text-[10.5px] text-text-3 mt-1">
                    {hint}
                </span>
            )}
        </label>
    );
}
