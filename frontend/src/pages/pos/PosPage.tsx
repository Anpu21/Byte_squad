import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useScanDetection } from '@/hooks/useScanDetection';
import UniversalScanner from '@/components/Scanner/UniversalScanner';
import { inventoryService } from '@/services/inventory.service';
import { posService } from '@/services/pos.service';
import type { IProduct } from '@/services/inventory.service';
import type { ICreateTransactionPayload } from '@/services/pos.service';

interface CartItem {
    product: IProduct;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    isCustom?: boolean;
}

type PadMode = 'idle' | 'qty' | 'price' | 'disc' | 'custom';

export default function PosPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<IProduct[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<{ transactionNumber: string; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<string | null>(null);
    const [showCameraScanner, setShowCameraScanner] = useState(false);

    // Calculator / numpad state
    const [padMode, setPadMode] = useState<PadMode>('idle');
    const [padValue, setPadValue] = useState('');
    const [pendingQty, setPendingQty] = useState<number | null>(null);
    const [customName, setCustomName] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');

    // Cash tendered
    const [cashTendered, setCashTendered] = useState('');

    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Subtotal, discount, total
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountValue = discountType === 'percentage'
        ? Math.round(subtotal * (discountAmount / 100) * 100) / 100
        : discountAmount;
    const total = Math.max(0, Math.round((subtotal - discountValue) * 100) / 100);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cashChange = cashTendered ? Math.max(0, parseFloat(cashTendered) - total) : 0;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

    const addToCart = useCallback((product: IProduct) => {
        const qty = pendingQty ?? 1;
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id && !item.isCustom);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id && !item.isCustom
                        ? { ...item, quantity: item.quantity + qty, lineTotal: (item.quantity + qty) * item.unitPrice }
                        : item,
                );
            }
            return [...prev, {
                product,
                quantity: qty,
                unitPrice: Number(product.sellingPrice),
                lineTotal: qty * Number(product.sellingPrice),
            }];
        });
        setPendingQty(null);
        setPadMode('idle');
        setPadValue('');
        setSearch('');
        setSearchResults([]);
    }, [pendingQty]);

    const handleBarcodeScan = useCallback(async (barcode: string) => {
        setScanStatus('Scanning...');
        const product = await inventoryService.getProductByBarcode(barcode);
        if (product) {
            addToCart(product);
            setScanStatus(`Added: ${product.name}`);
        } else {
            setScanStatus(`Product not found: ${barcode}`);
        }
        setTimeout(() => setScanStatus(null), 2000);
    }, [addToCart]);

    // USB Barcode scanner detection
    useScanDetection({
        onScan: (barcode) => handleBarcodeScan(barcode),
        minLength: 4,
        enabled: !showPaymentModal && !showCameraScanner,
    });

    // Search with debounce
    useEffect(() => {
        if (!search.trim()) {
            setSearchResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (!user) return;
            setIsSearching(true);
            try {
                const result = await inventoryService.getByBranch(user.branchId, {
                    search: search.trim(),
                    limit: 12,
                });
                setSearchResults((result.items ?? []).map((inv) => inv.product));
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [search, user]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus(); }
            if (e.key === 'F12' && cart.length > 0) { e.preventDefault(); setShowPaymentModal(true); }
            if (e.key === 'Escape') {
                if (showPaymentModal) setShowPaymentModal(false);
                else if (padMode !== 'idle') { setPadMode('idle'); setPadValue(''); setCustomName(''); }
                else { setSearch(''); setSearchResults([]); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length, showPaymentModal, padMode]);

    const addCustomItem = () => {
        const price = parseFloat(padValue);
        if (!price || price <= 0 || !customName.trim()) return;
        const customProduct: IProduct = {
            id: `custom-${Date.now()}`,
            name: customName.trim(),
            barcode: '',
            description: 'Custom item',
            category: 'Custom',
            costPrice: 0,
            sellingPrice: price,
            imageUrl: null,
            isActive: true,
            createdAt: '',
            updatedAt: '',
        };
        const qty = pendingQty ?? 1;
        setCart((prev) => [...prev, {
            product: customProduct,
            quantity: qty,
            unitPrice: price,
            lineTotal: qty * price,
            isCustom: true,
        }]);
        setPadMode('idle');
        setPadValue('');
        setCustomName('');
        setPendingQty(null);
    };

    const updateQuantity = (productId: string, newQty: number) => {
        if (newQty <= 0) { removeFromCart(productId); return; }
        setCart((prev) => prev.map((item) =>
            item.product.id === productId
                ? { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice }
                : item,
        ));
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setError(null);
        setDiscountAmount(0);
        setPendingQty(null);
        setPadMode('idle');
        setPadValue('');
    };

    // Numpad helpers
    const padPress = (key: string) => {
        if (key === 'C') { setPadValue(''); return; }
        if (key === '.' && padValue.includes('.')) return;
        setPadValue((prev) => prev + key);
    };

    const padConfirm = () => {
        const val = parseFloat(padValue);
        if (!val && val !== 0) return;

        if (padMode === 'qty') {
            setPendingQty(Math.max(1, Math.floor(val)));
            setPadMode('idle');
            setPadValue('');
        } else if (padMode === 'disc') {
            setDiscountAmount(val);
            setPadMode('idle');
            setPadValue('');
        } else if (padMode === 'custom') {
            addCustomItem();
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        setError(null);

        const payload: ICreateTransactionPayload = {
            type: 'sale',
            paymentMethod,
            discountAmount: discountValue > 0 ? discountValue : undefined,
            discountType: discountValue > 0 ? 'fixed' : undefined,
            items: cart
                .filter((item) => !item.isCustom)
                .map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
        };

        try {
            const transaction = await posService.createTransaction(payload);
            setLastTransaction({
                transactionNumber: transaction.transactionNumber,
                total: Number(transaction.total),
            });
            setCart([]);
            setShowPaymentModal(false);
            setDiscountAmount(0);
            setCashTendered('');
        } catch {
            setError('Failed to complete sale. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const modeLabel: Record<PadMode, string> = {
        idle: '',
        qty: 'Enter Quantity',
        price: 'Enter Price',
        disc: `Discount (${discountType === 'percentage' ? '%' : 'LKR'})`,
        custom: 'Custom Item Price',
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Status bars */}
                {scanStatus && (
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-medium animate-in fade-in duration-200">
                        {scanStatus}
                    </div>
                )}
                {pendingQty && (
                    <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white font-bold animate-in fade-in duration-200 flex items-center justify-between">
                        <span>Quantity: {pendingQty}x — Now scan or select a product</span>
                        <button onClick={() => setPendingQty(null)} className="text-slate-400 hover:text-white text-xs underline">Cancel</button>
                    </div>
                )}

                {/* Search Bar + Scan Button */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </div>
                        <input
                            ref={searchInputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-14 pl-12 pr-24 bg-[#111111] border border-white/10 rounded-2xl text-lg text-white outline-none focus:border-white/30 focus:ring-[3px] focus:ring-white/10 transition-all placeholder:text-slate-500 shadow-xl"
                            placeholder="Scan barcode or search product..."
                            autoFocus
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {search && (
                                <button onClick={() => { setSearch(''); setSearchResults([]); }} className="p-1 text-slate-500 hover:text-white transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                            <kbd className="hidden sm:inline-flex items-center justify-center h-7 px-2.5 rounded border border-white/20 bg-white/5 text-[11px] font-bold text-slate-400">F2</kbd>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCameraScanner(true)}
                        className="h-14 w-14 flex-shrink-0 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all shadow-xl"
                        title="Scan with camera"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </button>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto rounded-2xl">
                    {isSearching ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4 animate-pulse">
                                    <div className="h-4 w-3/4 bg-white/5 rounded mb-3" />
                                    <div className="h-3 w-1/2 bg-white/5 rounded mb-4" />
                                    <div className="h-6 w-1/3 bg-white/5 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {searchResults.map((product) => {
                                const inCart = cart.find((c) => c.product.id === product.id);
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="bg-[#111111] border border-white/10 rounded-xl p-4 text-left hover:bg-white/[0.04] hover:border-white/20 transition-all group relative"
                                    >
                                        {inCart && (
                                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-white text-slate-900 rounded-full w-5 h-5 flex items-center justify-center">
                                                {inCart.quantity}
                                            </span>
                                        )}
                                        {pendingQty && (
                                            <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/20 text-white rounded px-1.5 py-0.5">
                                                {pendingQty}x
                                            </span>
                                        )}
                                        <p className="text-sm font-semibold text-white truncate mb-1">{product.name}</p>
                                        <p className="text-[11px] text-slate-500 mb-1 truncate">{product.category}</p>
                                        <p className="text-[11px] text-slate-600 mb-3 font-mono">{product.barcode}</p>
                                        <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(Number(product.sellingPrice))}</p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : search.trim() && !isSearching ? (
                        <div className="bg-[#111111] border border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 h-full">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-600 mb-3" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <p className="text-sm text-slate-400">No products found for "{search}"</p>
                        </div>
                    ) : (
                        <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 h-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
                                    <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-center relative z-10">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                            <line x1="7" y1="7" x2="7" y2="17" /><line x1="12" y1="7" x2="12" y2="17" /><line x1="17" y1="7" x2="17" y2="17" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to Scan</h3>
                                <p className="text-sm text-slate-400 max-w-[280px]">Scan a barcode or search by name to add items to the cart.</p>
                                <div className="flex items-center gap-4 mt-6 text-[11px] text-slate-600">
                                    <span><kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400 font-bold">F2</kbd> Search</span>
                                    <span><kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400 font-bold">F12</kbd> Checkout</span>
                                    <span><kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400 font-bold">ESC</kbd> Close</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Cart + Calculator */}
            <div className="w-[420px] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col flex-shrink-0">

                {/* Cart Header */}
                <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white tracking-tight">Current Sale</h2>
                        {totalItems > 0 && (
                            <span className="text-[10px] font-bold bg-white text-slate-900 rounded-full w-5 h-5 flex items-center justify-center">{totalItems}</span>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-[11px] font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition-colors">Clear</button>
                    )}
                </div>

                {/* Cart Items */}
                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[120px]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/10 mb-2" strokeWidth="1">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <p className="text-xs text-slate-500">Cart is empty</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-[100px]">
                        {cart.map((item) => (
                            <div key={item.product.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/[0.03] group transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white truncate">
                                        {item.isCustom && <span className="text-slate-500 mr-1">[Custom]</span>}
                                        {item.product.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 tabular-nums">{formatCurrency(item.unitPrice)} each</p>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                        className="w-6 h-6 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold">-</button>
                                    <input type="number" min="1" value={item.quantity}
                                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                        className="w-8 h-6 text-center bg-transparent text-white text-xs font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                        className="w-6 h-6 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold">+</button>
                                </div>
                                <p className="text-xs font-semibold text-white tabular-nums w-16 text-right">{formatCurrency(item.lineTotal)}</p>
                                <button onClick={() => removeFromCart(item.product.id)}
                                    className="p-0.5 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Calculator Pad */}
                <div className="border-t border-white/10 bg-[#0a0a0a]/80">
                    {/* Mode buttons */}
                    <div className="grid grid-cols-4 gap-1 p-2 pb-1">
                        {([
                            { mode: 'qty' as PadMode, label: 'QTY', title: 'Set quantity before adding product' },
                            { mode: 'disc' as PadMode, label: 'DISC', title: 'Apply discount to bill' },
                            { mode: 'custom' as PadMode, label: 'CUSTOM', title: 'Add custom item' },
                        ] as const).map((btn) => (
                            <button
                                key={btn.mode}
                                onClick={() => {
                                    if (padMode === btn.mode) { setPadMode('idle'); setPadValue(''); setCustomName(''); }
                                    else { setPadMode(btn.mode); setPadValue(''); setCustomName(''); }
                                }}
                                title={btn.title}
                                className={`h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    padMode === btn.mode
                                        ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(255,255,255,0.15)]'
                                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                        {padMode === 'disc' && (
                            <button
                                onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                                className="h-8 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                {discountType === 'fixed' ? 'LKR' : '%'}
                            </button>
                        )}
                    </div>

                    {/* Pad display + numpad (visible when a mode is active) */}
                    {padMode !== 'idle' && (
                        <div className="px-2 pb-2">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">{modeLabel[padMode]}</p>

                            {/* Custom item name input */}
                            {padMode === 'custom' && (
                                <input
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Item name..."
                                    className="w-full h-8 px-3 mb-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-white/30 placeholder:text-slate-600"
                                />
                            )}

                            {/* Display */}
                            <div className="h-10 px-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-end mb-1.5">
                                <span className="text-lg font-bold text-white tabular-nums tracking-tight">
                                    {padMode === 'disc' && discountType === 'percentage' && padValue ? `${padValue}%` : padValue || '0'}
                                </span>
                            </div>

                            {/* Numpad grid */}
                            <div className="grid grid-cols-4 gap-1">
                                {['7','8','9','C','4','5','6','.','1','2','3',''].map((key, i) => (
                                    key ? (
                                        <button
                                            key={key + i}
                                            onClick={() => padPress(key)}
                                            className={`h-9 rounded-lg text-sm font-bold transition-all ${
                                                key === 'C'
                                                    ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {key}
                                        </button>
                                    ) : <div key={i} />
                                ))}
                                <button
                                    onClick={() => padPress('0')}
                                    className="h-9 rounded-lg text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all col-span-2"
                                >
                                    0
                                </button>
                                <button
                                    onClick={padConfirm}
                                    className="h-9 rounded-lg text-sm font-bold bg-white text-slate-900 hover:shadow-[0_2px_8px_rgba(255,255,255,0.15)] transition-all col-span-2"
                                >
                                    {padMode === 'qty' ? 'SET QTY' : padMode === 'disc' ? 'APPLY' : 'ADD'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Checkout Footer */}
                <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/50">
                    {error && (
                        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">{error}</div>
                    )}
                    {lastTransaction && (
                        <div className="mb-2 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                            <p className="text-xs font-semibold text-white mb-0.5">Sale Complete</p>
                            <p className="text-[11px] text-slate-400">{lastTransaction.transactionNumber} — {formatCurrency(lastTransaction.total)}</p>
                            <button onClick={() => setLastTransaction(null)} className="text-[10px] text-slate-500 hover:text-white mt-0.5 underline">Dismiss</button>
                        </div>
                    )}

                    <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Subtotal</span>
                            <span className="text-slate-200 tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        {discountValue > 0 && (
                            <div className="flex justify-between text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    Discount
                                    <button onClick={() => { setDiscountAmount(0); }} className="text-slate-600 hover:text-white">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </span>
                                <span className="text-slate-200 tabular-nums font-medium">-{formatCurrency(discountValue)}</span>
                            </div>
                        )}
                        <div className="pt-2 mt-1 border-t border-dashed border-white/10 flex justify-between items-end">
                            <span className="text-xs font-medium text-slate-300">Total</span>
                            <span className="text-xl font-bold text-white tabular-nums tracking-tight leading-none">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { setShowPaymentModal(true); setCashTendered(''); }}
                        disabled={cart.length === 0}
                        className="w-full h-11 rounded-xl bg-white text-slate-900 text-sm font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        Complete Sale
                        <kbd className="ml-1 inline-flex items-center justify-center h-5 px-1.5 rounded bg-slate-200 text-[9px] font-bold text-slate-600">F12</kbd>
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Complete Sale</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className="p-5">
                            {/* Order Summary */}
                            <div className="mb-5 p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                                    <span className="text-slate-300 tabular-nums">{formatCurrency(subtotal)}</span>
                                </div>
                                {discountValue > 0 && (
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-400">Discount</span>
                                        <span className="text-slate-300 tabular-nums">-{formatCurrency(discountValue)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end pt-2 border-t border-white/5">
                                    <span className="text-sm font-semibold text-white">Total</span>
                                    <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Method</p>
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {([
                                    { value: 'cash' as const, label: 'Cash', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
                                    { value: 'card' as const, label: 'Card', icon: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20' },
                                    { value: 'mobile' as const, label: 'Mobile', icon: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01' },
                                ]).map((method) => (
                                    <button
                                        key={method.value}
                                        onClick={() => { setPaymentMethod(method.value); setCashTendered(''); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                                            paymentMethod === method.value
                                                ? 'bg-white text-slate-900 border-white shadow-[0_4px_12px_rgba(255,255,255,0.15)]'
                                                : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={method.icon} /></svg>
                                        <span className="text-xs font-bold">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cash Change Calculator */}
                            {paymentMethod === 'cash' && (
                                <div className="mb-5 p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cash Received</p>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={cashTendered}
                                        onChange={(e) => setCashTendered(e.target.value)}
                                        placeholder={total.toFixed(2)}
                                        className="w-full h-12 px-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-xl text-white font-bold tabular-nums outline-none focus:border-white/30 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        autoFocus
                                    />
                                    {/* Quick cash buttons */}
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {[100, 500, 1000, 5000].map((amt) => (
                                            <button
                                                key={amt}
                                                onClick={() => setCashTendered(String(amt))}
                                                className="h-8 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors tabular-nums"
                                            >
                                                {amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    {cashTendered && parseFloat(cashTendered) >= total && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-sm font-semibold text-slate-400">Change Due</span>
                                            <span className="text-2xl font-bold text-white tabular-nums">{formatCurrency(cashChange)}</span>
                                        </div>
                                    )}
                                    {cashTendered && parseFloat(cashTendered) < total && (
                                        <p className="mt-2 text-xs text-red-400">Insufficient amount — need {formatCurrency(total - parseFloat(cashTendered))} more</p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut || (paymentMethod === 'cash' && !!cashTendered && parseFloat(cashTendered) < total)}
                                className="w-full h-12 rounded-xl bg-white text-slate-900 text-sm font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCheckingOut ? (
                                    <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />Processing...</>
                                ) : (
                                    <>Confirm {formatCurrency(total)}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Scanner Modal */}
            {showCameraScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <UniversalScanner onScanSuccess={(scannedBarcode) => { handleBarcodeScan(scannedBarcode); setShowCameraScanner(false); }} />
                        <button type="button" onClick={() => setShowCameraScanner(false)}
                            className="mt-3 w-full h-10 rounded-xl border border-white/10 bg-[#111111] text-white text-sm font-medium hover:bg-white/5 transition-colors">
                            Close Scanner
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
