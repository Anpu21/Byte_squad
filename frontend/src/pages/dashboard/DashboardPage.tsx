export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {['Today\'s Sales', 'Total Revenue', 'Active Products', 'Low Stock Items'].map(
                    (title) => (
                        <div key={title} className="glass-card p-5">
                            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                                {title}
                            </p>
                            <p className="text-2xl font-bold text-white mt-2">—</p>
                        </div>
                    ),
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
                        Sales Overview
                    </h3>
                    <div className="h-64 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                        Chart will be rendered here
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
                        Top Selling Products
                    </h3>
                    <div className="h-64 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                        Chart will be rendered here
                    </div>
                </div>
            </div>
        </div>
    );
}
