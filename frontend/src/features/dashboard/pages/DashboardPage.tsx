import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/features/auth/authSlice';
import type { RootState, AppDispatch } from '@/store';

/**
 * Placeholder dashboard page shown after login.
 * Will be replaced with actual accounting features later.
 */
export default function DashboardPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            {/* Top nav */}
            <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-white">LedgerPro</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">{user?.username}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={() => dispatch(logout())}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-slate-400">Welcome back, <span className="text-indigo-400 font-medium">{user?.username}</span></p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Total Revenue', value: '₹0.00', icon: '📈', color: 'from-emerald-500/20 to-emerald-500/5' },
                        { title: 'Expenses', value: '₹0.00', icon: '📊', color: 'from-orange-500/20 to-orange-500/5' },
                        { title: 'Net Profit', value: '₹0.00', icon: '💰', color: 'from-indigo-500/20 to-indigo-500/5' },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/10 p-6 backdrop-blur-xl`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-2xl">{card.icon}</span>
                            </div>
                            <p className="text-sm text-slate-400">{card.title}</p>
                            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur-xl">
                    <p className="text-slate-400">Accounting modules coming soon. Start by managing your chart of accounts.</p>
                </div>
            </main>
        </div>
    );
}
