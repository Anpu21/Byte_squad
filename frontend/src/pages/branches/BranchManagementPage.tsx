import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useConfirm } from '@/hooks/useConfirm';
import Modal from '@/components/ui/Modal';
import type {
    IBranchWithMeta,
    IBranchCreatePayload,
    IBranchUpdatePayload,
} from '@/types';
import toast from 'react-hot-toast';

type EditingBranch = IBranchWithMeta | null;

function BranchModal({
    editing,
    onClose,
    onSaved,
}: {
    editing: EditingBranch;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = editing !== null;
    const [form, setForm] = useState<IBranchCreatePayload>({
        name: editing?.name ?? '',
        address: editing?.address ?? '',
        phone: editing?.phone ?? '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEdit && editing) {
                const payload: IBranchUpdatePayload = { ...form };
                await adminService.updateBranch(editing.id, payload);
                toast.success('Branch updated');
            } else {
                await adminService.createBranch(form);
                toast.success('Branch created');
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(
                axiosErr.response?.data?.message ||
                    (isEdit ? 'Failed to update branch' : 'Failed to create branch'),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isEdit ? 'Edit Branch' : 'Create Branch'}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full h-9 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                            Address
                        </label>
                        <input
                            type="text"
                            required
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full h-9 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                            Phone
                        </label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full h-9 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-9 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-9 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Branch'}
                        </button>
                    </div>
                </form>
        </Modal>
    );
}

interface BranchManagementPageProps {
    embedded?: boolean;
}

export default function BranchManagementPage({
    embedded = false,
}: BranchManagementPageProps = {}) {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<EditingBranch>(null);

    const { data: branches = [], isLoading } = useQuery({
        queryKey: ['admin-branches'],
        queryFn: adminService.listBranches,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
        queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
                className={
                    embedded
                        ? 'flex justify-end mb-4'
                        : 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8'
                }
            >
                {!embedded && (
                    <div>
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">Branch Management</h1>
                        <p className="text-sm text-text-2 mt-1">Create, edit, and manage all branches</p>
                    </div>
                )}
                <button
                    onClick={openCreate}
                    className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all self-start sm:self-auto"
                >
                    + Create Branch
                </button>
            </div>

            <div className="bg-surface border border-border rounded-md overflow-hidden">
                <div className="overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3">
                                    <th className="px-6 py-4 font-semibold">Name</th>
                                    <th className="px-6 py-4 font-semibold">Address</th>
                                    <th className="px-6 py-4 font-semibold">Phone</th>
                                    <th className="px-6 py-4 font-semibold">Admin</th>
                                    <th className="px-6 py-4 font-semibold">Staff</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {branches.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-text-3">
                                            No branches yet
                                        </td>
                                    </tr>
                                ) : (
                                    branches.map((b) => (
                                        <tr
                                            key={b.id}
                                            className="border-b border-border hover:bg-surface-2"
                                        >
                                            <td className="px-6 py-4 text-text-1 font-medium">{b.name}</td>
                                            <td className="px-6 py-4 text-text-2">{b.address}</td>
                                            <td className="px-6 py-4 text-text-2">{b.phone || '—'}</td>
                                            <td className="px-6 py-4">
                                                {b.adminName ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-text-1">{b.adminName}</span>
                                                        <span className="text-[11px] text-text-3">{b.adminEmail}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-warning-soft text-warning border border-warning/40 uppercase tracking-widest">
                                                        No admin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-text-1">{b.staffCount}</td>
                                            <td className="px-6 py-4">
                                                {b.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 text-text-1 text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-text-3 text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-text-3" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEdit(b)}
                                                    className="text-xs text-text-1 hover:text-text-1 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => toggleMutation.mutate(b.id)}
                                                    className="text-xs text-text-1 hover:text-text-1 hover:underline"
                                                >
                                                    {b.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const ok = await confirm({
                                                            title: 'Delete branch?',
                                                            body: `Delete branch "${b.name}". This will fail if the branch has any users or transactions.`,
                                                            confirmLabel: 'Delete branch',
                                                            tone: 'danger',
                                                        });
                                                        if (ok) {
                                                            deleteMutation.mutate(b.id);
                                                        }
                                                    }}
                                                    className="text-xs text-danger hover:text-danger hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <BranchModal
                    editing={editing}
                    onClose={() => setShowModal(false)}
                    onSaved={invalidate}
                />
            )}
        </div>
    );
}
