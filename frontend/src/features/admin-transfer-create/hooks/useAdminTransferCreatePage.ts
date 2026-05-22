import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConfirm } from '@/hooks/useConfirm';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IBranch } from '@/types';
import { useAdminTransferCart } from './useAdminTransferCart';
import { useAdminTransferCreate } from './useAdminTransferCreate';
import { buildAdminDirectPayload } from '../helpers/build-payload';

interface UseAdminTransferCreatePageArgs {
    onCreated?: (count: number) => void;
}

export function useAdminTransferCreatePage({
    onCreated,
}: UseAdminTransferCreatePageArgs = {}) {
    const confirm = useConfirm();
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });

    const [sourceBranchId, setSourceBranchId] = useState<string>('');
    const [destinationBranchId, setDestinationBranchId] = useState<string>('');
    const [approvalNote, setApprovalNote] = useState<string>('');

    const cart = useAdminTransferCart();
    const createMutation = useAdminTransferCreate({
        onSuccess: (count) => {
            cart.clearCart();
            setApprovalNote('');
            onCreated?.(count);
        },
    });

    const activeBranches = useMemo<IBranch[]>(
        () =>
            (branchesQuery.data ?? []).filter((branch) => branch.isActive),
        [branchesQuery.data],
    );

    const branchById = useMemo(() => {
        const map = new Map<string, IBranch>();
        for (const branch of activeBranches) map.set(branch.id, branch);
        return map;
    }, [activeBranches]);

    const sourceBranch = sourceBranchId
        ? (branchById.get(sourceBranchId) ?? null)
        : null;
    const destinationBranch = destinationBranchId
        ? (branchById.get(destinationBranchId) ?? null)
        : null;

    const swapBranches = () => {
        setSourceBranchId(destinationBranchId);
        setDestinationBranchId(sourceBranchId);
    };

    const canSubmit =
        Boolean(sourceBranchId) &&
        Boolean(destinationBranchId) &&
        sourceBranchId !== destinationBranchId &&
        cart.lines.length > 0 &&
        cart.lines.every((line) => line.quantity > 0) &&
        !createMutation.isPending;

    const handleSubmit = async () => {
        if (!canSubmit || !sourceBranch || !destinationBranch) return;
        const ok = await confirm({
            title: 'Create transfers?',
            body: `Send ${cart.totalUnits} unit(s) across ${cart.lines.length} product(s) from ${sourceBranch.name} to ${destinationBranch.name}. The receiving branch will see these as ready-to-ship approved transfers.`,
            confirmLabel: `Create ${cart.lines.length} transfer${cart.lines.length === 1 ? '' : 's'}`,
        });
        if (!ok) return;
        createMutation.mutate(
            buildAdminDirectPayload({
                sourceBranchId,
                destinationBranchId,
                approvalNote,
                lines: cart.lines,
            }),
        );
    };

    return {
        branches: activeBranches,
        branchesLoading: branchesQuery.isLoading,
        sourceBranchId,
        destinationBranchId,
        sourceBranch,
        destinationBranch,
        setSourceBranchId,
        setDestinationBranchId,
        swapBranches,
        approvalNote,
        setApprovalNote,
        cart,
        canSubmit,
        isSubmitting: createMutation.isPending,
        handleSubmit,
    };
}
