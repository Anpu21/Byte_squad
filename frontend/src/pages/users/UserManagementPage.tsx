export default function UserManagementPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <button className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors">
                    + Create User
                </button>
            </div>
            <div className="glass-card p-6">
                <p className="text-[var(--color-text-muted)] text-sm">
                    No users created yet.
                </p>
            </div>
        </div>
    );
}
