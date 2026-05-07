import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">
                        {isEdit ? 'Edit Branch' : 'Create Branch'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Address
                        </label>
                        <input
                            type="text"
                            required
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Phone
                        </label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-9 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-9 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Branch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface BranchManagementPageProps {
    embedded?: boolean;
}

export default function BranchManagementPage({
    embedded = false,
}: BranchManagementPageProps = {}) {
    const queryClient = useQueryClient();
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
                        <h1 className="text-2xl font-bold text-white tracking-tight">Branch Management</h1>
                        <p className="text-sm text-slate-400 mt-1">Create, edit, and manage all branches</p>
                    </div>
                )}
                <button
                    onClick={openCreate}
                    className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all self-start sm:self-auto"
                >
                    + Create Branch
                </button>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500">
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
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                            No branches yet
                                        </td>
                                    </tr>
                                ) : (
                                    branches.map((b) => (
                                        <tr
                                            key={b.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-6 py-4 text-slate-200 font-medium">{b.name}</td>
                                            <td className="px-6 py-4 text-slate-400">{b.address}</td>
                                            <td className="px-6 py-4 text-slate-400">{b.phone || '—'}</td>
                                            <td className="px-6 py-4">
                                                {b.adminName ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-300">{b.adminName}</span>
                                                        <span className="text-[11px] text-slate-500">{b.adminEmail}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                                                        No admin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{b.staffCount}</td>
                                            <td className="px-6 py-4">
                                                {b.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 text-white text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-slate-500 text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEdit(b)}
                                                    className="text-xs text-slate-300 hover:text-white hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => toggleMutation.mutate(b.id)}
                                                    className="text-xs text-slate-300 hover:text-white hover:underline"
                                                >
                                                    {b.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete branch "${b.name}"? This will fail if the branch has any users or transactions.`)) {
                                                            deleteMutation.mutate(b.id);
                                                        }
                                                    }}
                                                    className="text-xs text-red-400 hover:text-red-300 hover:underline"
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
