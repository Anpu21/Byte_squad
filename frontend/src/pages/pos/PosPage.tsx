export default function PosPage() {
    return (
        <div className="h-[calc(100vh-5rem)] flex gap-4">
            {/* Product search / scan area */}
            <div className="flex-1 flex flex-col">
                <div className="mb-4">
                    <input
                        className="glass-input w-full text-lg"
                        placeholder="🔍 Scan barcode or search product... (F2)"
                        autoFocus
                    />
                </div>

                <div className="flex-1 glass-card p-4 overflow-auto">
                    <p className="text-[var(--color-text-muted)] text-sm text-center mt-8">
                        Scan a barcode or search for a product to begin.
                    </p>
                </div>
            </div>

            {/* Cart */}
            <div className="w-96 glass-card flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-sm font-medium text-white">Current Sale</h2>
                </div>

                <div className="flex-1 p-4 overflow-auto">
                    <p className="text-[var(--color-text-muted)] text-xs text-center mt-4">
                        Cart is empty
                    </p>
                </div>

                <div className="p-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                        <span className="text-white font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-indigo-400">$0.00</span>
                    </div>

                    <button className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors">
                        Complete Sale (F12)
                    </button>
                </div>
            </div>
        </div>
    );
}
