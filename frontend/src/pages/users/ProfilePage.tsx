import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IUserProfile } from '@/types';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: profile, isLoading } = useQuery<IUserProfile>({
        queryKey: ['profile'],
        queryFn: profileService.getProfile,
    });

    // ── Profile edit state ──
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileInitialized, setProfileInitialized] = useState(false);

    if (profile && !profileInitialized) {
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setProfileInitialized(true);
    }

    const updateProfileMutation = useMutation({
        mutationFn: (data: { firstName?: string; lastName?: string }) =>
            profileService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated');
        },
        onError: () => toast.error('Failed to update profile'),
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => profileService.uploadAvatar(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Avatar updated');
        },
        onError: () => toast.error('Failed to upload avatar. Max 2MB, images only.'),
    });

    // ── Password change state ──
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwLoading, setPwLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
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

        setPwLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setPwError(axiosErr.response?.data?.message || 'Failed to change password');
            } else {
                setPwError('An unexpected error occurred');
            }
        } finally {
            setPwLoading(false);
        }
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            avatarMutation.mutate(file);
        }
    };

    const getRoleBadge = (role: string) => {
        const labels: Record<string, string> = {
            [UserRole.ADMIN]: 'Administrator',
            [UserRole.MANAGER]: 'Manager',
            [UserRole.ACCOUNTANT]: 'Accountant',
            [UserRole.CASHIER]: 'Cashier',
        };
        if (role === UserRole.ADMIN) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-slate-900 uppercase tracking-widest shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    {labels[role]}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-300 border border-white/20 uppercase tracking-widest">
                {labels[role] || role}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const initials = profile
        ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
        : user
          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
          : '??';

    return (
        <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
                <p className="text-sm text-slate-400 mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl">
                        {/* Avatar */}
                        <div className="relative group cursor-pointer mb-5" onClick={handleAvatarClick}>
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-inner overflow-hidden transition-transform group-hover:scale-105 duration-300">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <h2 className="text-lg font-bold text-white tracking-tight">
                            {profile?.firstName} {profile?.lastName}
                        </h2>
                        <p className="text-sm text-slate-400 mb-4">{profile?.email}</p>

                        {profile && getRoleBadge(profile.role)}
                    </div>

                    {/* Meta Information */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Status</span>
                            <span className="text-white font-medium flex items-center gap-1.5">
                                {profile?.isVerified ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                        Verified
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-amber-400/60" />
                                        <span className="text-amber-400">Pending</span>
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Member Since</span>
                            <span className="text-white font-medium">
                                {profile?.createdAt
                                    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Branch Info */}
                    {profile?.branch && (
                        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl">
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Branch</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Name</span>
                                    <span className="text-white font-medium">{profile.branch.name}</span>
                                </div>
                                {profile.branch.address && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Address</span>
                                        <span className="text-white font-medium text-right max-w-[60%]">{profile.branch.address}</span>
                                    </div>
                                )}
                                {profile.branch.phone && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Phone</span>
                                        <span className="text-white font-medium">{profile.branch.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Settings Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Info Card */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="text-base font-semibold text-white tracking-tight">Personal Information</h3>
                            <p className="text-xs text-slate-400 mt-1">Update your name. Email and role are managed by your administrator.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        First Name
                                    </label>
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        Last Name
                                    </label>
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        Email Address
                                    </label>
                                    <input
                                        value={profile?.email || ''}
                                        disabled
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        Role
                                    </label>
                                    <input
                                        value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                                        disabled
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed capitalize"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex justify-end">
                            <button
                                onClick={() => updateProfileMutation.mutate({ firstName, lastName })}
                                disabled={updateProfileMutation.isPending}
                                className="h-9 px-5 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Security Card */}
                    <form onSubmit={handlePasswordChange} className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="text-base font-semibold text-white tracking-tight">Security</h3>
                            <p className="text-xs text-slate-400 mt-1">Update your password to keep your account secure.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {pwError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <p className="text-red-400 text-sm">{pwError}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="Min 8 characters"
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Re-enter password"
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex justify-end">
                            <button
                                type="submit"
                                disabled={pwLoading}
                                className="h-9 px-5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                {pwLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
