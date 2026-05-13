import { useAppSelector } from '@/store/hooks';
import { selectIsAdmin } from '@/store/selectors/auth';
import { useAdminProfilePage } from '@/features/admin-user-profile/hooks/useAdminProfilePage';
import { AdminAvatarCard } from '@/features/admin-user-profile/components/AdminAvatarCard';
import { AdminStatusCard } from '@/features/admin-user-profile/components/AdminStatusCard';
import { AdminBranchCard } from '@/features/admin-user-profile/components/AdminBranchCard';
import { AdminGlobalScopeCard } from '@/features/admin-user-profile/components/AdminGlobalScopeCard';
import { AdminPersonalInfoForm } from '@/features/admin-user-profile/components/AdminPersonalInfoForm';
import { AdminPasswordCard } from '@/features/admin-user-profile/components/AdminPasswordCard';

export function ProfilePage() {
    const p = useAdminProfilePage();
    const isAdmin = useAppSelector(selectIsAdmin);

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    My Profile
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <AdminAvatarCard
                        profile={p.profile}
                        initials={p.initials}
                        onUploadAvatar={p.onUploadAvatar}
                    />
                    <AdminStatusCard profile={p.profile} />
                    {isAdmin ? (
                        <AdminGlobalScopeCard />
                    ) : (
                        p.profile?.branch && (
                            <AdminBranchCard branch={p.profile.branch} />
                        )
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <AdminPersonalInfoForm
                        firstName={p.personal.firstName}
                        setFirstName={p.personal.setFirstName}
                        lastName={p.personal.lastName}
                        setLastName={p.personal.setLastName}
                        email={p.profile?.email}
                        role={p.profile?.role}
                        isSubmitting={p.savingProfile}
                        onSave={p.saveProfile}
                    />
                    <AdminPasswordCard
                        currentPassword={p.password.currentPassword}
                        setCurrentPassword={p.password.setCurrentPassword}
                        newPassword={p.password.newPassword}
                        setNewPassword={p.password.setNewPassword}
                        confirmPassword={p.password.confirmPassword}
                        setConfirmPassword={p.password.setConfirmPassword}
                        error={p.password.error}
                        submitting={p.password.submitting}
                        onSubmit={p.password.submit}
                    />
                </div>
            </div>
        </div>
    );
}
