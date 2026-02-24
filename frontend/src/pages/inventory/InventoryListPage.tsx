export default function InventoryListPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Inventory</h1>
                <button className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors">
                    + Add Product
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left p-4 text-[var(--color-text-muted)] font-medium">
                                Product
                            </th>
                            <th className="text-left p-4 text-[var(--color-text-muted)] font-medium">
                                Barcode
                            </th>
                            <th className="text-left p-4 text-[var(--color-text-muted)] font-medium">
                                Category
                            </th>
                            <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">
                                Stock
                            </th>
                            <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">
                                Price
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">
                                No products yet. Click &quot;+ Add Product&quot; to get started.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
