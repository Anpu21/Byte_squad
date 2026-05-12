import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/hooks/useConfirm';
import type { IBranchWithMeta } from '@/types';

export type EditingBranch = IBranchWithMeta | null;

export function useBranchManagementPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<EditingBranch>(null);

    const { data: branches = [], isLoading } = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.branches() });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.overview() });
    };

    const toggleMutation = useMutation({
        mutationFn: adminService.toggleBranchActive,
        onSuccess: () => {
            invalidate();
            toast.success('Branch status updated');
        },
        onError: () => toast.error('Failed to toggle branch'),
    });

    const deleteMutation = useMutation({
        mutationFn: adminService.deleteBranch,
        onSuccess: () => {
            invalidate();
            toast.success('Branch deleted');
        },
        onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(
                axiosErr.response?.data?.message ||
                    'Cannot delete branch (may have existing data)',
            );
        },
    });

    const openCreate = () => {
        setEditing(null);
        setShowModal(true);
    };

    const openEdit = (branch: IBranchWithMeta) => {
        setEditing(branch);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const requestDelete = async (branch: IBranchWithMeta) => {
        const ok = await confirm({
            title: 'Delete branch?',
            body: `Delete branch "${branch.name}". This will fail if the branch has any users or transactions.`,
            confirmLabel: 'Delete branch',
            tone: 'danger',
        });
        if (ok) {
            deleteMutation.mutate(branch.id);
        }
    };

    return {
        branches,
        isLoading,
        showModal,
        editing,
        openCreate,
        openEdit,
        closeModal,
        onSaved: invalidate,
        onToggle: toggleMutation.mutate,
        onRequestDelete: requestDelete,
    };
}
