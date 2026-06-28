import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IPurchaseOrderPayload } from '@/types';
import {
    useDraftReorders,
    useReorderSuggestions,
} from '@/features/purchases/hooks/useReorderSuggestions';
import { ReorderControls } from './ReorderControls';
import { ReorderSupplierCard } from './ReorderSupplierCard';

interface IReorderPanelProps {
    /** Switch to the Orders tab after drafting so the new POs are visible. */
    onDrafted?: () => void;
}

/**
 * Reorder suggestions: low stock + recent sales velocity → a per-supplier
 * shopping list, with one click to draft a Purchase Order per supplier. The
 * drafted POs land in the Orders tab as editable Drafts.
 */
export function ReorderPanel({ onDrafted }: IReorderPanelProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const [branchId, setBranchId] = useState('');
    const [leadDays, setLeadDays] = useState(7);
    const [lookbackDays, setLookbackDays] = useState(30);
    const [deselected, setDeselected] = useState<Set<string>>(new Set());

    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        staleTime: 5 * 60_000,
        enabled: isAdmin,
    });
    const branchOptions = useMemo(
        () => [
            { value: '', label: 'Select a branch…' },
            ...(branchesQuery.data ?? []).map((b) => ({
                value: b.id,
                label: b.name,
            })),
        ],
        [branchesQuery.data],
    );

    const params = {
        branchId: isAdmin ? branchId || undefined : undefined,
        leadDays,
        lookbackDays,
    };
    const enabled = isAdmin ? Boolean(branchId) : true;
    const query = useReorderSuggestions(params, enabled);
    const draft = useDraftReorders();

    const groups = query.data?.groups ?? [];
    const selectedGroups = groups.filter((g) => !deselected.has(g.supplierId));

    function toggle(supplierId: string) {
        setDeselected((prev) => {
            const next = new Set(prev);
            if (next.has(supplierId)) next.delete(supplierId);
            else next.add(supplierId);
            return next;
        });
    }

    async function handleDraft() {
        if (selectedGroups.length === 0 || draft.isPending) return;
        const orders: IPurchaseOrderPayload[] = selectedGroups.map((g) => ({
            supplierId: g.supplierId,
            branchId: isAdmin ? branchId : undefined,
            items: g.lines.map((l) => ({
                productId: l.productId,
                quantity: l.suggestedQty,
                unitCost: l.unitCost,
            })),
        }));
        try {
            const created = await draft.mutateAsync(orders);
            toast.success(
                `Drafted ${created.length} purchase order${created.length === 1 ? '' : 's'}`,
            );
            onDrafted?.();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)
                      ?.message
                : undefined;
            toast.error(msg ?? 'Could not draft purchase orders');
        }
    }

    return (
        <div className="space-y-4">
            <ReorderControls
                leadDays={leadDays}
                lookbackDays={lookbackDays}
                onLeadDays={setLeadDays}
                onLookbackDays={setLookbackDays}
                isAdmin={isAdmin}
                branchId={branchId}
                onBranchId={setBranchId}
                branchOptions={branchOptions}
            />

            {isAdmin && !branchId ? (
                <EmptyState
                    title="Pick a branch"
                    description="Choose a branch to see its reorder suggestions."
                />
            ) : query.isLoading ? (
                <p className="py-10 text-center text-[13px] text-text-3">
                    Loading suggestions…
                </p>
            ) : groups.length === 0 ? (
                <EmptyState
                    title="Nothing to reorder"
                    description="Every stocked item is above its reorder point for this window."
                />
            ) : (
                <>
                    {query.data && query.data.unassignedCount > 0 && (
                        <p className="text-[12px] text-text-3">
                            {query.data.unassignedCount} low item
                            {query.data.unassignedCount === 1 ? '' : 's'} have no
                            supplier history and can&rsquo;t be auto-drafted.
                        </p>
                    )}
                    <div className="space-y-3">
                        {groups.map((g) => (
                            <ReorderSupplierCard
                                key={g.supplierId}
                                group={g}
                                selected={!deselected.has(g.supplierId)}
                                onToggle={toggle}
                            />
                        ))}
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                        <span className="text-[13px] text-text-2">
                            {selectedGroups.length} supplier
                            {selectedGroups.length === 1 ? '' : 's'} selected
                        </span>
                        <Button
                            variant="primary"
                            onClick={() => void handleDraft()}
                            disabled={
                                selectedGroups.length === 0 || draft.isPending
                            }
                        >
                            {draft.isPending
                                ? 'Drafting…'
                                : `Create ${selectedGroups.length} draft PO${selectedGroups.length === 1 ? '' : 's'}`}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
