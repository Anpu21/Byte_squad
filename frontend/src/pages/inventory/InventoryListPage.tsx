export default function InventoryListPage() {
    // Mock inventory data
    const inventoryItems = [
        { id: '1', name: 'Premium Wireless Headphones', sku: 'WH-2099', barcode: '8901234567890', category: 'Electronics', stock: 145, price: 299.00, status: 'In Stock' },
        { id: '2', name: 'Ergonomic Office Chair', sku: 'CH-1042', barcode: '8901234567891', category: 'Furniture', stock: 12, price: 199.50, status: 'Low Stock' },
        { id: '3', name: 'Mechanical Keyboard (Linear)', sku: 'KB-0441', barcode: '8901234567892', category: 'Electronics', stock: 0, price: 149.99, status: 'Out of Stock' },
        { id: '4', name: 'Stainless Steel Water Bottle', sku: 'WB-9908', barcode: '8901234567893', category: 'Accessories', stock: 350, price: 24.00, status: 'In Stock' },
        { id: '5', name: 'USB-C Display Dock', sku: 'DK-3321', barcode: '8901234567894', category: 'Electronics', stock: 48, price: 89.99, status: 'In Stock' },
    ];

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Helper for monochrome status badges
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'In Stock':
                return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-white/10 text-white border border-white/20">In Stock</span>;
            case 'Low Stock':
                return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-300 border border-white/20">Low Stock</span>;
            case 'Out of Stock':
                return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-500 border border-white/10 border-dashed">Out of Stock</span>;
            default:
                return null;
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Inventory</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage your product catalog and stock levels</p>
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
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Product
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Table Controls (Search & Filter) */}
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/[0.02]">
                    <div className="relative w-full sm:w-80">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search products, SKU, or barcode..." 
                            className="w-full h-9 pl-9 pr-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white/30 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>All Categories</option>
                            <option>Electronics</option>
                            <option>Furniture</option>
                            <option>Accessories</option>
                        </select>
                        <select className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>Stock Status</option>
                            <option>In Stock</option>
                            <option>Low Stock</option>
                            <option>Out of Stock</option>
                        </select>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Product</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Category</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Stock</th>
                                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Price</th>
                                <th className="px-6 py-4 font-semibold text-center"></th> {/* Actions */}
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {inventoryItems.map((item) => (
                                <tr 
                                    key={item.id} 
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-default"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium">{item.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-slate-500">SKU: {item.sku}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span className="text-[11px] text-slate-500 font-mono tracking-wider">{item.barcode}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {item.category}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className={`px-6 py-4 text-right tabular-nums font-medium ${item.stock === 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                                        {item.stock}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-white font-medium">
                                        {formatCurrency(item.price)}
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
                    <span>Showing 1 to 5 of 248 products</span>
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