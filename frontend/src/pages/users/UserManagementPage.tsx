import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import type { IUser, IBranch, IUserCreatePayload } from '@/types';
import toast from 'react-hot-toast';

function CreateUserModal({
    branches,
    currentUserRole,
    currentUserBranchId,
    onClose,
    onCreated,
}: {
    branches: IBranch[];
    currentUserRole: UserRole;
    currentUserBranchId: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    // Admins can only create non-admin staff within their own branch.
    const isAdmin = currentUserRole === UserRole.ADMIN;
    const defaultBranchId = isAdmin
        ? currentUserBranchId
        : branches[0]?.id || '';

    const [form, setForm] = useState<IUserCreatePayload>({
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.CASHIER,
        branchId: defaultBranchId,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await userService.create(form);
            toast.success('User created! A welcome email with login credentials has been sent.');
            onCreated();
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                toast.error(axiosErr.response?.data?.message || 'Failed to create user');
            } else {
                toast.error('Failed to create user');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Create New User</h2>
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
                                className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Last Name</label>
                            <input
                                type="text"
                                required
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors"
                            placeholder="user@company.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Role</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                                className="w-full h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                            >
                                <option value={UserRole.CASHIER}>Cashier</option>
                                <option value={UserRole.ACCOUNTANT}>Accountant</option>
                                <option value={UserRole.MANAGER}>Manager</option>
                                {!isAdmin && (
                                    <option value={UserRole.ADMIN}>Admin</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Branch</label>
                            <select
                                value={form.branchId}
                                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                disabled={isAdmin}
                                className="w-full h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-2">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            A temporary password will be auto-generated and sent to the user's email. They must change it on first login.
                        </p>
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
                            className="flex-1 h-9 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: userService.getAll,
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: userService.getBranches,
    });

    const deleteMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted');
        },
        onError: () => toast.error('Failed to delete user'),
    });

    const resendMutation = useMutation({
        mutationFn: userService.resendCredentials,
        onSuccess: () => toast.success('Credentials resent via email'),
        onError: () => toast.error('Failed to resend credentials'),
    });

    // Filter users
    const filteredUsers = users.filter((user: IUser) => {
        const matchesSearch =
            !searchQuery ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        const matchesBranch = branchFilter === 'all' || user.branchId === branchFilter;

        return matchesSearch && matchesRole && matchesBranch;
    });

    const getRoleBadge = (role: string) => {
        if (role === UserRole.ADMIN) {
            return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-white text-slate-900 uppercase tracking-widest shadow-[0_2px_10px_rgba(255,255,255,0.1)]">Admin</span>;
        }
        const labels: Record<string, string> = {
            [UserRole.MANAGER]: 'Manager',
            [UserRole.ACCOUNTANT]: 'Accountant',
            [UserRole.CASHIER]: 'Cashier',
        };
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-300 border border-white/20">{labels[role] || role}</span>;
    };

    const getStatusIndicator = (user: IUser) => {
        if (!user.isVerified) {
            return (
                <span className="flex items-center gap-1.5 text-amber-400 text-[13px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400/60"></span>
                    Pending
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 text-white font-medium text-[13px]">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                Verified
            </span>
        );
    };

    const getBranchName = (branchId: string) => {
        const branch = branches.find((b: IBranch) => b.id === branchId);
        return branch?.name || '—';
    };

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage team members, roles, and branch access</p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Create User
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col">

                {/* Table Controls */}
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/[0.02] rounded-t-2xl">
                    <div className="relative w-full sm:w-80">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.ACCOUNTANT}>Accountant</option>
                            <option value={UserRole.CASHIER}>Cashier</option>
                        </select>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                        >
                            <option value="all">All Branches</option>
                            {branches.map((branch: IBranch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#111111]">
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-[#111111] z-[1]">User</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-[#111111] z-[1]">Role</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-[#111111] z-[1]">Status</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-[#111111] z-[1]">Branch</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-[#111111] z-[1]">Created</th>
                                    <th className="px-6 py-4 font-semibold text-center sticky top-0 bg-[#111111] z-[1]"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                            {searchQuery || roleFilter !== 'all' || branchFilter !== 'all'
                                                ? 'No users match your filters'
                                                : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user: IUser) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-default"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 flex-shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-200 font-medium">{user.firstName} {user.lastName}</span>
                                                        <span className="text-[11px] text-slate-500">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                            <td className="px-6 py-4">{getStatusIndicator(user)}</td>
                                            <td className="px-6 py-4 text-slate-400">{getBranchName(user.branchId)}</td>
                                            <td className="px-6 py-4 text-slate-500 text-[13px]">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center relative">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                    className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                                                    </svg>
                                                </button>
                                                {openMenuId === user.id && (
                                                    <div className="absolute right-6 top-12 z-10 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1">
                                                        {!user.isVerified && (
                                                            <button
                                                                onClick={() => {
                                                                    resendMutation.mutate(user.id);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                            >
                                                                Resend Credentials
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
                                                                    deleteMutation.mutate(user.id);
                                                                }
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                        >
                                                            Delete User
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50 rounded-b-2xl">
                    <span>Showing {filteredUsers.length} of {users.length} users</span>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && branches.length > 0 && currentUser && (
                <CreateUserModal
                    branches={branches}
                    currentUserRole={currentUser.role as UserRole}
                    currentUserBranchId={currentUser.branchId}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
                />
            )}
        </div>
    );
}
