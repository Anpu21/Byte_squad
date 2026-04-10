import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminService } from '@/services/super-admin.service';
import { userService } from '@/services/user.service';
import { UserRole } from '@/constants/enums';
import type {
    IAdminWithBranch,
    IBranch,
    IUserCreatePayload,
} from '@/types';
import toast from 'react-hot-toast';

type EditingAdmin = IAdminWithBranch | null;

function AdminModal({
    branches,
    editing,
    onClose,
    onSaved,
}: {
    branches: IBranch[];
    editing: EditingAdmin;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = editing !== null;
    const [form, setForm] = useState<IUserCreatePayload>({
        email: editing?.email ?? '',
        firstName: editing?.firstName ?? '',
        lastName: editing?.lastName ?? '',
        role: UserRole.ADMIN,
        branchId: editing?.branchId ?? branches[0]?.id ?? '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEdit && editing) {
                await superAdminService.updateAdmin(editing.id, {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    branchId: form.branchId,
                });
                toast.success('Admin updated');
            } else {
                await superAdminService.createAdmin(form);
                toast.success('Admin created — credentials emailed');
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(
                axiosErr.response?.data?.message ||
                    (isEdit ? 'Failed to update admin' : 'Failed to create admin'),
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
                        {isEdit ? 'Edit Admin' : 'Create Admin'}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">First Name</label>
                            <input
                                type="text"
                                required
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Last Name</label>
                            <input
                                type="text"
                                required
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            disabled={isEdit}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 disabled:opacity-60"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Branch</label>
                        <select
                            value={form.branchId}
                            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                            className="w-full h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                        >
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    {!isEdit && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                A temporary password will be auto-generated and emailed to the admin. They must change it on first login.
                            </p>
                        </div>
                    )}
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
                            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function formatLastLogin(last: string | null): string {
    if (!last) return 'Never';
    const d = new Date(last);
    return d.toLocaleString();
}

export default function AdminManagementPage() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<EditingAdmin>(null);

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['super-admin-admins'],
        queryFn: superAdminService.listAdmins,
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: userService.getBranches,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['super-admin-admins'] });
        queryClient.invalidateQueries({ queryKey: ['super-admin-overview'] });
        queryClient.invalidateQueries({ queryKey: ['super-admin-branches'] });
    };

    const deleteMutation = useMutation({
        mutationFn: superAdminService.deleteAdmin,
        onSuccess: () => {
            invalidate();
            toast.success('Admin deleted');
        },
        onError: () => toast.error('Failed to delete admin'),
    });

    const resetMutation = useMutation({
        mutationFn: superAdminService.resetAdminPassword,
        onSuccess: () => toast.success('Password reset — new credentials emailed'),
        onError: () => toast.error('Failed to reset password'),
    });

    const openCreate = () => {
        setEditing(null);
        setShowModal(true);
    };

    const openEdit = (admin: IAdminWithBranch) => {
        setEditing(admin);
        setShowModal(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Create and manage branch admin accounts</p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={branches.length === 0}
                    className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-50 self-start sm:self-auto"
                >
                    + Create Admin
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
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Branch</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Last Login</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {admins.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                            No admins yet
                                        </td>
                                    </tr>
                                ) : (
                                    admins.map((a) => (
                                        <tr
                                            key={a.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-6 py-4 text-slate-200 font-medium">
                                                {a.firstName} {a.lastName}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{a.email}</td>
                                            <td className="px-6 py-4 text-slate-300">{a.branchName || '—'}</td>
                                            <td className="px-6 py-4">
                                                {a.isVerified ? (
                                                    <span className="inline-flex items-center gap-1.5 text-white text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-amber-400 text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-amber-400/60" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-[13px]">
                                                {formatLastLogin(a.lastLoginAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEdit(a)}
                                                    className="text-xs text-slate-300 hover:text-white hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Reset password for ${a.email}? A new temp password will be emailed.`)) {
                                                            resetMutation.mutate(a.id);
                                                        }
                                                    }}
                                                    className="text-xs text-slate-300 hover:text-white hover:underline"
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete admin ${a.email}?`)) {
                                                            deleteMutation.mutate(a.id);
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
                <AdminModal
                    branches={branches}
                    editing={editing}
                    onClose={() => setShowModal(false)}
                    onSaved={invalidate}
                />
            )}
        </div>
    );
}
