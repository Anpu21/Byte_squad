export default function ProductFormPage() {
    return (
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Back Navigation */}
            <div className="mb-8">
                <button className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 mb-4 font-medium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to Inventory
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">Add New Product</h1>
                <p className="text-sm text-slate-400 mt-1">Enter the details for your new inventory item.</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8 space-y-8">
                    
                    {/* Section 1: General Info */}
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-5 pb-2 border-b border-white/10">
                            General Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Product Name
                                </label>
                                <input 
                                    className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600" 
                                    placeholder="e.g. Premium Wireless Headphones" 
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Category
                                </label>
                                <div className="relative">
                                    <select className="w-full h-11 pl-4 pr-10 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all appearance-none cursor-pointer">
                                        <option value="" disabled selected>Select category...</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="accessories">Accessories</option>
                                    </select>
                                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6"/>
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Barcode / UPC
                                </label>
                                <input 
                                    className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600" 
                                    placeholder="Scan or enter barcode" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Pricing & Stock */}
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-5 pb-2 border-b border-white/10">
                            Pricing Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Cost Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
                                    <input 
                                        type="number" 
                                        className="w-full h-11 pl-8 pr-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600 tabular-nums" 
                                        placeholder="0.00" 
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">Your internal purchase cost.</p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Selling Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
                                    <input 
                                        type="number" 
                                        className="w-full h-11 pl-8 pr-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600 tabular-nums" 
                                        placeholder="0.00" 
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">Customer facing price.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
                    <button className="h-10 px-5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button className="h-10 px-6 rounded-xl bg-white text-slate-900 text-sm font-bold tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save Product
                    </button>
                </div>
            </div>
        </div>
    );
}