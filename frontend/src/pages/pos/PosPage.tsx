export default function PosPage() {
    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Left Column: Product Search / Scan Area */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 5v2a7 7 0 0 0 14 0V5" />
                            <path d="M4 19v-2a7 7 0 0 1 14 0v2" />
                            <path d="M5 12h14" />
                        </svg>
                    </div>
                    <input
                        className="w-full h-16 pl-14 pr-24 bg-[#111111] border border-white/10 rounded-2xl text-lg text-white outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-500 shadow-xl"
                        placeholder="Scan barcode or search product..."
                        autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <kbd className="hidden sm:inline-flex items-center justify-center h-7 px-2.5 rounded border border-white/20 bg-white/5 text-[11px] font-bold text-slate-300 shadow-[0_2px_0_rgba(255,255,255,0.1)]">
                            F2
                        </kbd>
                    </div>
                </div>

                {/* Main Product Area (Premium Empty State) */}
                <div className="flex-1 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full"></div>
                            <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-center relative z-10 shadow-inner">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                                    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                                    <line x1="7" y1="7" x2="7" y2="17"></line>
                                    <line x1="12" y1="7" x2="12" y2="17"></line>
                                    <line x1="17" y1="7" x2="17" y2="17"></line>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to Scan</h3>
                        <p className="text-sm text-slate-400 max-w-[280px]">
                            Scan a product barcode using the scanner, or search by name to add items to the cart.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Cart Panel */}
            <div className="w-[400px] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
                
                {/* Cart Header */}
                <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-base font-bold text-white tracking-tight">Current Sale</h2>
                    <button className="text-[11px] font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition-colors">
                        Clear
                    </button>
                </div>

                {/* Cart Items Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/10 mb-4" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p className="text-sm font-medium text-slate-400">Cart is empty</p>
                </div>

                {/* Checkout Footer */}
                <div className="p-6 border-t border-white/10 bg-[#0a0a0a]/50">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-slate-400 font-medium">
                            <span>Subtotal</span>
                            <span className="text-slate-200 tabular-nums">Rs 0.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400 font-medium">
                            <span>Tax (Calculated at checkout)</span>
                            <span className="text-slate-200 tabular-nums">Rs 0.00</span>
                        </div>
                        <div className="pt-3 mt-3 border-t border-dashed border-white/10 flex justify-between items-end">
                            <span className="text-sm font-medium text-slate-300">Total</span>
                            <span className="text-3xl font-bold text-white tabular-nums tracking-tight leading-none">Rs 0.00</span>
                        </div>
                    </div>

                    <button className="w-full h-14 rounded-xl bg-white text-slate-900 text-[15px] font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                            <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                        Complete Sale
                        <kbd className="ml-2 inline-flex items-center justify-center h-6 px-2 rounded bg-slate-200 text-[10px] font-bold text-slate-700 shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                            F12
                        </kbd>
                    </button>
                </div>
            </div>
            
        </div>
    );
}