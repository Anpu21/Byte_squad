export default function ExpensesPage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Expenses</h1>
                    <p className="text-sm text-slate-400 mt-1">Track and manage your company outgoings</p>
                </div>
                
                <button className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2 self-start sm:self-auto">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Expense
                </button>
            </div>

            {/* Quick Stats - Gives the page structure even when empty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                    <p className="text-[13px] font-medium text-slate-400 mb-1">This Month</p>
                    <p className="text-2xl font-bold text-white tracking-tight">$0.00</p>
                </div>
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                    <p className="text-[13px] font-medium text-slate-400 mb-1">Pending Approval</p>
                    <p className="text-2xl font-bold text-white tracking-tight">0</p>
                </div>
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                    <p className="text-[13px] font-medium text-slate-400 mb-1">Active Categories</p>
                    <p className="text-2xl font-bold text-white tracking-tight">-</p>
                </div>
            </div>

            {/* Premium Empty State */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                
                {/* Custom glowing icon container */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white/5 blur-xl rounded-full"></div>
                    <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                            <rect x="9" y="9" width="6" height="6"></rect>
                            <line x1="9" y1="1" x2="9" y2="4"></line>
                            <line x1="15" y1="1" x2="15" y2="4"></line>
                            <line x1="9" y1="20" x2="9" y2="23"></line>
                            <line x1="15" y1="20" x2="15" y2="23"></line>
                            <line x1="20" y1="9" x2="23" y2="9"></line>
                            <line x1="20" y1="14" x2="23" y2="14"></line>
                            <line x1="1" y1="9" x2="4" y2="9"></line>
                            <line x1="1" y1="14" x2="4" y2="14"></line>
                        </svg>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                    No expenses recorded yet
                </h3>
                
                <p className="text-sm text-slate-400 max-w-[280px] mb-8 leading-relaxed">
                    Keep track of your spending by logging your first business expense.
                </p>
                
                {/* Secondary Action inside Empty State */}
                <button className="h-9 px-5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Import CSV
                </button>
            </div>
        </div>
    );
}