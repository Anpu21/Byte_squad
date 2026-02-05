import { useAppSelector } from '@store/hooks';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user } = useAppSelector((state) => state.auth);

    const stats = [
        { icon: '💰', label: 'Total Sales', value: '₹12,45,000', change: '+12.5%', positive: true },
        { icon: '📦', label: 'Total Purchases', value: '₹8,32,000', change: '+8.2%', positive: true },
        { icon: '📊', label: 'Net Profit', value: '₹4,13,000', change: '+15.3%', positive: true },
        { icon: '⏳', label: 'Outstanding', value: '₹2,18,000', change: '-5.1%', positive: false },
    ];

    const recentTransactions = [
        { id: 'TXN001', type: 'Sales', party: 'ABC Traders', amount: 15000, date: '2026-02-05' },
        { id: 'TXN002', type: 'Purchase', party: 'XYZ Suppliers', amount: 22000, date: '2026-02-05' },
        { id: 'TXN003', type: 'Receipt', party: 'DEF Corp', amount: 35000, date: '2026-02-04' },
        { id: 'TXN004', type: 'Payment', party: 'GHI Industries', amount: 18500, date: '2026-02-04' },
        { id: 'TXN005', type: 'Sales', party: 'JKL Retail', amount: 9800, date: '2026-02-03' },
    ];

    const lowStockItems = [
        { name: 'Product A', current: 5, reorder: 10, unit: 'pcs' },
        { name: 'Product B', current: 3, reorder: 15, unit: 'pcs' },
        { name: 'Product C', current: 8, reorder: 20, unit: 'kg' },
    ];

    return (
        <div className="dashboard-page animate-fade-in">
            {/* Welcome Section */}
            <div className="dashboard-welcome">
                <h1 className="dashboard-welcome__title">
                    Welcome back, <span className="gradient-text">{user?.firstName || 'User'}</span>! 👋
                </h1>
                <p className="dashboard-welcome__subtitle">
                    Here's what's happening with your business today.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card glassmorphism">
                        <div className="stat-card__icon">{stat.icon}</div>
                        <div className="stat-card__content">
                            <span className="stat-card__label">{stat.label}</span>
                            <span className="stat-card__value">{stat.value}</span>
                            <span className={`stat-card__change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Transactions */}
                <div className="dashboard-card glassmorphism">
                    <div className="dashboard-card__header">
                        <h2 className="dashboard-card__title">Recent Transactions</h2>
                        <button className="dashboard-card__action">View All</button>
                    </div>
                    <div className="dashboard-card__content">
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Party</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((txn) => (
                                    <tr key={txn.id}>
                                        <td className="txn-id">{txn.id}</td>
                                        <td>
                                            <span className={`txn-badge txn-badge--${txn.type.toLowerCase()}`}>
                                                {txn.type}
                                            </span>
                                        </td>
                                        <td>{txn.party}</td>
                                        <td className="txn-amount">₹{txn.amount.toLocaleString()}</td>
                                        <td className="txn-date">{txn.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="dashboard-card glassmorphism">
                    <div className="dashboard-card__header">
                        <h2 className="dashboard-card__title">⚠️ Low Stock Alerts</h2>
                        <button className="dashboard-card__action">View Inventory</button>
                    </div>
                    <div className="dashboard-card__content">
                        <div className="stock-alerts">
                            {lowStockItems.map((item) => (
                                <div key={item.name} className="stock-alert-item">
                                    <div className="stock-alert-item__info">
                                        <span className="stock-alert-item__name">{item.name}</span>
                                        <span className="stock-alert-item__detail">
                                            Reorder level: {item.reorder} {item.unit}
                                        </span>
                                    </div>
                                    <div className="stock-alert-item__status">
                                        <span className="stock-alert-item__current">
                                            {item.current} {item.unit}
                                        </span>
                                        <div className="stock-alert-item__bar">
                                            <div
                                                className="stock-alert-item__progress"
                                                style={{ width: `${(item.current / item.reorder) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-card glassmorphism">
                    <div className="dashboard-card__header">
                        <h2 className="dashboard-card__title">Quick Actions</h2>
                    </div>
                    <div className="dashboard-card__content">
                        <div className="quick-actions">
                            <button className="quick-action-btn">
                                <span className="quick-action-btn__icon">🛒</span>
                                <span>New Sale</span>
                            </button>
                            <button className="quick-action-btn">
                                <span className="quick-action-btn__icon">📦</span>
                                <span>New Purchase</span>
                            </button>
                            <button className="quick-action-btn">
                                <span className="quick-action-btn__icon">💳</span>
                                <span>Receive Payment</span>
                            </button>
                            <button className="quick-action-btn">
                                <span className="quick-action-btn__icon">📝</span>
                                <span>Journal Entry</span>
                            </button>
                            <button className="quick-action-btn">
                                <span className="quick-action-btn__icon">📊</span>
                                <span>View Reports</span>
                            </button>
                            <button className="quick-action-btn">
                                <span className="quick-action-btn__icon">💾</span>
                                <span>Backup Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
