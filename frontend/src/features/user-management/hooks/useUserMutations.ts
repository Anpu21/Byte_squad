import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import type { IUser } from '@/types';

export function useUserMutations() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });

    const deleteMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            invalidate();
            toast.success('User deleted');
        },
        onError: () => toast.error('Failed to delete user'),
    });

    const resendMutation = useMutation({
        mutationFn: userService.resendCredentials,
        onSuccess: () => toast.success('Credentials resent via email'),
        onError: () => toast.error('Failed to resend credentials'),
    });

    const resetPasswordMutation = useMutation({
        mutationFn: userService.resetPassword,
        onSuccess: () =>
            toast.success('Password reset — new credentials sent via email'),
        onError: () => toast.error('Failed to reset password'),
    });

    const confirmAndDelete = async (user: IUser) => {
        const ok = await confirm({
            title: 'Delete user?',
            body: `Permanently delete ${user.firstName} ${user.lastName}. This can't be undone.`,
            confirmLabel: 'Delete user',
            tone: 'danger',
        });
        if (ok) deleteMutation.mutate(user.id);
    };

    const confirmAndResetPassword = async (user: IUser) => {
        const ok = await confirm({
            title: 'Reset password?',
            body: `Reset password for ${user.firstName} ${user.lastName}? A new temporary password will be emailed and they'll need to change it on next login.`,
            confirmLabel: 'Reset password',
        });
        if (ok) resetPasswordMutation.mutate(user.id);
    };

    return {
        invalidate,
        confirmAndDelete,
        confirmAndResetPassword,
        resendCredentials: (id: string) => resendMutation.mutate(id),
    };
}
