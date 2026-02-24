export default function ProductFormPage() {
    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-6">Add Product</h1>

            <div className="glass-card p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
                            Product Name
                        </label>
                        <input className="glass-input w-full" placeholder="Enter name" />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
                            Barcode
                        </label>
                        <input className="glass-input w-full" placeholder="Enter barcode" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
                            Cost Price
                        </label>
                        <input type="number" className="glass-input w-full" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
                            Selling Price
                        </label>
                        <input type="number" className="glass-input w-full" placeholder="0.00" />
                    </div>
                </div>

                <button className="px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors">
                    Save Product
                </button>
            </div>
        </div>
    );
}
