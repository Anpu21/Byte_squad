import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { UserRole } from '@/constants/enums';
import { useConfirm } from '@/hooks/useConfirm';
import type { IUser, IBranch, IUserCreatePayload } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';

function CreateUserModal({
    branches,
    onClose,
    onCreated,
}: {
    branches: IBranch[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState<IUserCreatePayload>({
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.CASHIER,
        branchId: branches[0]?.id || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await userService.create(form);
            toast.success(
                'User created. A welcome email with login credentials has been sent.',
            );
            onCreated();
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as {
                    response?: { data?: { message?: string } };
                };
                toast.error(
                    axiosErr.response?.data?.message || 'Failed to create user',
                );
            } else {
                toast.error('Failed to create user');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        'w-full h-9 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 transition-colors';

    return (
        <Modal isOpen onClose={onClose} title="Invite user" maxWidth="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                                First name
                            </label>
                            <input
                                type="text"
                                required
                                value={form.firstName}
                                onChange={(e) =>
                                    setForm({ ...form, firstName: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                                Last name
                            </label>
                            <input
                                type="text"
                                required
                                value={form.lastName}
                                onChange={(e) =>
                                    setForm({ ...form, lastName: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            className={inputClass}
                            placeholder="user@company.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                                Role
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        role: e.target.value as UserRole,
                                    })
                                }
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value={UserRole.CASHIER}>Cashier</option>
                                <option value={UserRole.MANAGER}>Manager</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                                Branch
                            </label>
                            <select
                                value={form.branchId}
                                onChange={(e) =>
                                    setForm({ ...form, branchId: e.target.value })
                                }
                                className={`${inputClass} cursor-pointer`}
                            >
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-surface-2 border border-border rounded-md p-3">
                        <p className="text-xs text-text-2 leading-relaxed">
                            A temporary password will be auto-generated and sent
                            to the user&apos;s email. They must change it on first
                            login.
                        </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Creating…' : 'Send invite'}
                        </Button>
                    </div>
                </form>
        </Modal>
    );
}

const ROLE_LABELS: Record<string, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.CASHIER]: 'Cashier',
};

function RolePill({ role }: { role: string }) {
    if (role === UserRole.ADMIN) {
        return <Pill tone="primary">Admin</Pill>;
    }
    if (role === UserRole.MANAGER) {
        return <Pill tone="info">Manager</Pill>;
    }
    return <Pill tone="neutral">{ROLE_LABELS[role] || role}</Pill>;
}

function StatusBadge({ user }: { user: IUser }) {
    if (!user.isVerified) {
        return <Pill tone="warning">Invited</Pill>;
    }
    return <Pill tone="success">Active</Pill>;
}

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const { data: users = [], isLoading } = useQuery({
        queryKey: queryKeys.users.all(),
        queryFn: userService.getAll,
    });

    const { data: branches = [] } = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });

    const deleteMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
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

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter((user: IUser) => {
            const matchesSearch =
                !q ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q);
            const matchesRole =
                roleFilter === 'all' || user.role === roleFilter;
            const matchesBranch =
                branchFilter === 'all' || user.branchId === branchFilter;
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [users, searchQuery, roleFilter, branchFilter]);

    const activeCount = users.filter((u: IUser) => u.isVerified).length;

    const getBranchName = (branchId: string | null) => {
        if (!branchId) return '—';
        const branch = branches.find((b: IBranch) => b.id === branchId);
        return branch?.name || '—';
    };

    const selectClass =
        'h-9 bg-canvas border border-border text-text-1 text-sm rounded-md px-3 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 cursor-pointer transition-colors';

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Users
                    </h1>
                    <p className="text-sm text-text-2 mt-1">
                        {activeCount} active{' '}
                        {activeCount === 1 ? 'member' : 'members'} ·{' '}
                        {users.length} total
                    </p>
                </div>

                <Button
                    onClick={() => setShowCreateModal(true)}
                    disabled={branches.length === 0}
                >
                    <UserPlus size={14} />
                    Invite user
                </Button>
            </div>

            {/* Filter row */}
            <Card className="mb-4">
                <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder="Search name or email…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 placeholder:text-text-3 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">All roles</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.CASHIER}>Cashier</option>
                        </select>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">All branches</option>
                            {branches.map((branch: IBranch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Users table */}
            <Card>
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-surface-2 z-[1]">
                                <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 border-b border-border">
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        User
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Email
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Role
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Branch
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                                        Joined
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold text-right" />
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-16 text-center text-text-3"
                                        >
                                            {searchQuery ||
                                            roleFilter !== 'all' ||
                                            branchFilter !== 'all'
                                                ? 'No users match your filters'
                                                : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user: IUser) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors group"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={`${user.firstName} ${user.lastName}`}
                                                        src={user.avatarUrl ?? undefined}
                                                        size={32}
                                                    />
                                                    <span className="text-text-1 font-medium">
                                                        {user.firstName}{' '}
                                                        {user.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-text-2 text-[13px]">
                                                {user.email}
                                            </td>
                                            <td className="px-5 py-3">
                                                <RolePill role={user.role} />
                                            </td>
                                            <td className="px-5 py-3 text-text-2 text-[13px]">
                                                {getBranchName(user.branchId)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge user={user} />
                                            </td>
                                            <td className="px-5 py-3 text-text-3 text-[13px]">
                                                {new Date(
                                                    user.createdAt,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3 text-right relative">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenMenuId(
                                                            openMenuId === user.id
                                                                ? null
                                                                : user.id,
                                                        )
                                                    }
                                                    className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors"
                                                    aria-label="Actions"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                {openMenuId === user.id && (
                                                    <div className="absolute right-3 top-10 z-10 w-48 bg-surface border border-border rounded-md shadow-xl py-1">
                                                        {!user.isVerified && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    resendMutation.mutate(
                                                                        user.id,
                                                                    );
                                                                    setOpenMenuId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors"
                                                            >
                                                                Resend credentials
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                setOpenMenuId(null);
                                                                const ok = await confirm({
                                                                    title: 'Reset password?',
                                                                    body: `Reset password for ${user.firstName} ${user.lastName}? A new temporary password will be emailed and they'll need to change it on next login.`,
                                                                    confirmLabel: 'Reset password',
                                                                });
                                                                if (ok) {
                                                                    resetPasswordMutation.mutate(user.id);
                                                                }
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors"
                                                        >
                                                            Reset password
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                setOpenMenuId(null);
                                                                const ok = await confirm({
                                                                    title: 'Delete user?',
                                                                    body: `Permanently delete ${user.firstName} ${user.lastName}. This can't be undone.`,
                                                                    confirmLabel: 'Delete user',
                                                                    tone: 'danger',
                                                                });
                                                                if (ok) {
                                                                    deleteMutation.mutate(user.id);
                                                                }
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
                                                        >
                                                            Delete user
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
                <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-text-3 bg-surface-2">
                    <span>
                        Showing {filteredUsers.length} of {users.length} users
                    </span>
                </div>
            </Card>

            {showCreateModal && branches.length > 0 && (
                <CreateUserModal
                    branches={branches}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() =>
                        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
                    }
                />
            )}
        </div>
    );
}
