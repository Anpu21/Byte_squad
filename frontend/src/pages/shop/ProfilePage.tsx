import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileQuery } from '@/features/customer-profile/hooks/useProfileQuery';
import { useProfileMutations } from '@/features/customer-profile/hooks/useProfileMutations';
import { usePersonalInfo } from '@/features/customer-profile/hooks/usePersonalInfo';
import { useBranchChange } from '@/features/customer-profile/hooks/useBranchChange';
import { usePasswordChange } from '@/features/customer-profile/hooks/usePasswordChange';
import { AvatarCard } from '@/features/customer-profile/components/AvatarCard';
import { PersonalInfoForm } from '@/features/customer-profile/components/PersonalInfoForm';
import { BranchPickerSection } from '@/features/customer-profile/components/BranchPickerSection';
import { PasswordChangeForm } from '@/features/customer-profile/components/PasswordChangeForm';

export default function CustomerProfilePage() {
    const { user } = useAuth();
    const profileQuery = useProfileQuery();
    const profile = profileQuery.data;
    const personal = usePersonalInfo(profile);
    const { updateProfile, uploadAvatar } = useProfileMutations();
    const branch = useBranchChange(profile);
    const password = usePasswordChange();

    if (profileQuery.isLoading) {
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

    const handlePersonalSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPhone = personal.phone.trim();
        updateProfile.mutate({
            firstName: personal.firstName.trim(),
            lastName: personal.lastName.trim(),
            phone: trimmedPhone.length > 0 ? trimmedPhone : null,
        });
    };

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
                <AvatarCard
                    displayName={displayName}
                    email={profile?.email}
                    avatarSrc={avatarSrc}
                    isUploading={uploadAvatar.isPending}
                    onUpload={(file) => uploadAvatar.mutate(file)}
                />

                <div className="space-y-6">
                    <PersonalInfoForm
                        firstName={personal.firstName}
                        setFirstName={personal.setFirstName}
                        lastName={personal.lastName}
                        setLastName={personal.setLastName}
                        email={profile?.email}
                        phone={personal.phone}
                        setPhone={personal.setPhone}
                        isSubmitting={updateProfile.isPending}
                        onSubmit={handlePersonalSave}
                    />
                    <BranchPickerSection
                        branch={profile?.branch}
                        branches={branch.branches}
                        branchesLoading={branch.branchesLoading}
                        selectedBranchId={branch.selectedBranchId}
                        setSelectedBranchId={branch.setSelectedBranchId}
                        isSaving={branch.updateBranchMutation.isPending}
                        onSave={(id) => branch.updateBranchMutation.mutate(id)}
                    />
                    <PasswordChangeForm
                        currentPassword={password.currentPassword}
                        setCurrentPassword={password.setCurrentPassword}
                        newPassword={password.newPassword}
                        setNewPassword={password.setNewPassword}
                        confirmPassword={password.confirmPassword}
                        setConfirmPassword={password.setConfirmPassword}
                        error={password.error}
                        submitting={password.submitting}
                        onSubmit={password.submit}
                    />
                </div>
            </div>
        </div>
    );
}
