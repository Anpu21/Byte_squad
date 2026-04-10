import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminService } from '@/services/super-admin.service';
import { userService } from '@/services/user.service';
import { UserRole } from '@/constants/enums';
import type { IUserWithBranch } from '@/types';

type StatusFilter = 'all' | 'verified' | 'unverified';
type RoleFilter = 'all' | UserRole;

function formatLastLogin(last: string | null): string {
    if (!last) return 'Never';
    return new Date(last).toLocaleString();
}

function formatCreated(created: string): string {
    return new Date(created).toLocaleDateString();
}

function roleLabel(role: UserRole): string {
    switch (role) {
        case UserRole.SUPER_ADMIN:
            return 'Super Admin';
        case UserRole.ADMIN:
            return 'Admin';
        case UserRole.MANAGER:
            return 'Manager';
        case UserRole.ACCOUNTANT:
            return 'Accountant';
        case UserRole.CASHIER:
            return 'Cashier';
        default:
            return role;
    }
}

export default function AllUsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['super-admin-all-users'],
        queryFn: superAdminService.listAllUsers,
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: userService.getBranches,
    });

    const filtered = useMemo<IUserWithBranch[]>(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            if (branchFilter !== 'all' && u.branchId !== branchFilter) return false;
            if (statusFilter === 'verified' && !u.isVerified) return false;
            if (statusFilter === 'unverified' && u.isVerified) return false;
            if (q) {
                const hay = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [users, search, roleFilter, branchFilter, statusFilter]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">All Users</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Read-only view of every user across all branches
                </p>
            </div>

            {/* Filters */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Name or email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 placeholder:text-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Role
                        </label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                            className="w-full h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                        >
                            <option value="all">All roles</option>
                            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.ACCOUNTANT}>Accountant</option>
                            <option value={UserRole.CASHIER}>Cashier</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Branch
                        </label>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="w-full h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                        >
                            <option value="all">All branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as StatusFilter)
                            }
                            className="w-full h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        {isLoading
                            ? 'Loading...'
                            : `${filtered.length} of ${users.length} users`}
                    </p>
                </div>
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
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Branch</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Last Login</th>
                                    <th className="px-6 py-4 font-semibold">Created</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-16 text-center text-slate-500"
                                        >
                                            No users match your filters
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-6 py-4 text-slate-200 font-medium">
                                                {u.firstName} {u.lastName}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {roleLabel(u.role)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {u.branchName || '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.isVerified ? (
                                                    <span className="inline-flex items-center gap-1.5 text-white text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-amber-400 text-[13px]">
                                                        <span className="w-2 h-2 rounded-full bg-amber-400/60" />
                                                        Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-[13px]">
                                                {formatLastLogin(u.lastLoginAt)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-[13px]">
                                                {formatCreated(u.createdAt)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
