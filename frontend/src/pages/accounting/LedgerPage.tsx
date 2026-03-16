export default function LedgerPage() {
    // Mock ledger data for visual reference
    const ledgerEntries = [
        { id: 'TRX-1092', date: '2026-03-16', description: 'Daily POS Sales Settlement', ref: 'INV-4401', debit: null, credit: 4250.00, balance: 128810.00 },
        { id: 'TRX-1091', date: '2026-03-15', description: 'Supplier Payment - TechCorp', ref: 'PO-2099', debit: 1200.00, credit: null, balance: 124560.00 },
        { id: 'TRX-1090', date: '2026-03-15', description: 'Utility Bill - Electricity', ref: 'BILL-092', debit: 345.50, credit: null, balance: 125760.00 },
        { id: 'TRX-1089', date: '2026-03-14', description: 'Daily POS Sales Settlement', ref: 'INV-4398', debit: null, credit: 3890.25, balance: 126105.50 },
        { id: 'TRX-1088', date: '2026-03-14', description: 'Refund - Order #8821', ref: 'REF-112', debit: 125.00, credit: null, balance: 122215.25 },
        { id: 'TRX-1087', date: '2026-03-13', description: 'Daily POS Sales Settlement', ref: 'INV-4355', debit: null, credit: 5120.00, balance: 122340.25 },
    ];

    // Helper to format currency
    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">General Ledger</h1>
                    <p className="text-sm text-slate-400 mt-1">View and manage all financial transactions</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="h-9 px-4 rounded-lg bg-transparent border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Export
                    </button>
                    <button className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        New Entry
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Table Controls (Search & Filter) */}
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/[0.02]">
                    <div className="relative w-full sm:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search transactions..." 
                            className="w-full h-9 pl-9 pr-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white/30 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>All Accounts</option>
                            <option>Assets</option>
                            <option>Liabilities</option>
                            <option>Equity</option>
                        </select>
                        <select className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>This Month</option>
                            <option>Last Month</option>
                            <option>This Year</option>
                        </select>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Ref / ID</th>
                                <th className="px-6 py-4 font-semibold text-right">Debit</th>
                                <th className="px-6 py-4 font-semibold text-right">Credit</th>
                                <th className="px-6 py-4 font-semibold text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {ledgerEntries.map((entry) => (
                                <tr 
                                    key={entry.id} 
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-default"
                                >
                                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                                        {entry.date}
                                    </td>
                                    <td className="px-6 py-4 text-slate-200 font-medium">
                                        {entry.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-300 font-medium">{entry.ref}</span>
                                            <span className="text-[11px] text-slate-600">{entry.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-slate-300">
                                        {formatCurrency(entry.debit)}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-white font-medium">
                                        {formatCurrency(entry.credit)}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-slate-300 font-medium">
                                        {formatCurrency(entry.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50">
                    <span>Showing 1 to 6 of 142 entries</span>
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
                            3
                        </button>
                        <span className="px-2">...</span>
                        <button className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}