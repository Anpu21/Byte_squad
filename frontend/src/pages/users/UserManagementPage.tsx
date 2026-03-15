export default function UserManagementPage() {
    // Mock user data
    const users = [
        { id: 'USR-001', firstName: 'John', lastName: 'Doe', email: 'john.doe@ledgerpro.com', role: 'Administrator', status: 'Active', lastLogin: '2 mins ago', branch: 'Main HQ' },
        { id: 'USR-002', firstName: 'Sarah', lastName: 'Connor', email: 's.connor@ledgerpro.com', role: 'Manager', status: 'Active', lastLogin: '1 hour ago', branch: 'Downtown Branch' },
        { id: 'USR-003', firstName: 'Mike', lastName: 'Ross', email: 'm.ross@ledgerpro.com', role: 'Accountant', status: 'Offline', lastLogin: 'Yesterday', branch: 'Main HQ' },
        { id: 'USR-004', firstName: 'Emma', lastName: 'Frost', email: 'e.frost@ledgerpro.com', role: 'Cashier', status: 'Active', lastLogin: '5 hours ago', branch: 'Uptown Kiosk' },
        { id: 'USR-005', firstName: 'James', lastName: 'Logan', email: 'j.logan@ledgerpro.com', role: 'Cashier', status: 'Suspended', lastLogin: '2 weeks ago', branch: 'Downtown Branch' },
    ];

    // Helper for monochrome role badges
    const getRoleBadge = (role: string) => {
        if (role === 'Administrator') {
            return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-white text-slate-900 uppercase tracking-widest shadow-[0_2px_10px_rgba(255,255,255,0.1)]">Admin</span>;
        }
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-300 border border-white/20">{role}</span>;
    };

    // Helper for monochrome status indicators
    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'Active':
                return (
                    <span className="flex items-center gap-1.5 text-white font-medium">
                        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                        Active
                    </span>
                );
            case 'Offline':
                return (
                    <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2 h-2 rounded-full border border-slate-500"></span>
                        Offline
                    </span>
                );
            case 'Suspended':
                return (
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Suspended
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage team members, roles, and branch access</p>
                </div>
                
                <button className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start sm:self-auto">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" y1="8" x2="19" y2="14"></line>
                        <line x1="22" y1="11" x2="16" y2="11"></line>
                    </svg>
                    Create User
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Table Controls */}
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/[0.02]">
                    <div className="relative w-full sm:w-80">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            className="w-full h-9 pl-9 pr-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>All Roles</option>
                            <option>Administrator</option>
                            <option>Manager</option>
                            <option>Cashier</option>
                        </select>
                        <select className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>All Branches</option>
                            <option>Main HQ</option>
                            <option>Downtown Branch</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">User</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Role</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Branch</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Last Login</th>
                                <th className="px-6 py-4 font-semibold text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {users.map((user) => (
                                <tr 
                                    key={user.id} 
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-default"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Minimalist Avatar */}
                                            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-medium">{user.firstName} {user.lastName}</span>
                                                <span className="text-[11px] text-slate-500">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4 text-[13px]">
                                        {getStatusIndicator(user.status)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {user.branch}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-[13px]">
                                        {user.lastLogin}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="19" cy="12" r="1"></circle>
                                                <circle cx="5" cy="12" r="1"></circle>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50">
                    <span>Showing 1 to 5 of 12 users</span>
                    <div className="flex items-center gap-1">
                        <button className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Previous
                        </button>
                        <button className="px-3 py-1.5 rounded border border-white/10 bg-white/10 text-white font-medium">
                            1
                        </button>
                        <button className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
                            2
                        </button>
                        <button className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}