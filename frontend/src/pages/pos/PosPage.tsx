import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useScanDetection } from '@/hooks/useScanDetection';
import { useConfirm } from '@/hooks/useConfirm';
import UniversalScanner from '@/components/Scanner/UniversalScanner';
import Modal from '@/components/ui/Modal';
import { inventoryService } from '@/services/inventory.service';
import { posService } from '@/services/pos.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
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
    const confirm = useConfirm();
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

    // Search with debounce + abort on next keystroke
    useEffect(() => {
        if (!search.trim()) {
            setSearchResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        const controller = new AbortController();
        debounceRef.current = setTimeout(async () => {
            if (!user || !user.branchId) return;
            setIsSearching(true);
            try {
                const result = await inventoryService.getByBranch(
                    user.branchId,
                    { search: search.trim(), limit: 12 },
                    { signal: controller.signal },
                );
                if (!controller.signal.aborted) {
                    setSearchResults((result.items ?? []).map((inv) => inv.product));
                }
            } catch (err) {
                if ((err as { name?: string })?.name !== 'CanceledError' && !controller.signal.aborted) {
                    setSearchResults([]);
                }
            } finally {
                if (!controller.signal.aborted) setIsSearching(false);
            }
        }, 250);
        return () => {
            clearTimeout(debounceRef.current);
            controller.abort();
        };
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

    const clearCart = async () => {
        if (cart.length === 0) return;
        const ok = await confirm({
            title: 'Clear current sale?',
            body: `Remove all ${cart.length} item${cart.length === 1 ? '' : 's'} from the cart. This cannot be undone.`,
            confirmLabel: 'Clear sale',
            tone: 'danger',
        });
        if (!ok) return;
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

    // Synchronous in-flight guard that beats React state lag — prevents a
    // double-fire from a fast Enter-key press before `isCheckingOut` updates.
    const checkoutInFlightRef = useRef(false);

    // Fresh idempotency key per payment-modal session. Generated once when
    // the modal opens; reused across retries within the same attempt so the
    // backend can safely de-dupe a network retry.
    const idempotencyKeyRef = useRef<string | null>(null);
    useEffect(() => {
        if (showPaymentModal) {
            idempotencyKeyRef.current =
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        } else {
            idempotencyKeyRef.current = null;
        }
    }, [showPaymentModal]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (checkoutInFlightRef.current) return;
        checkoutInFlightRef.current = true;
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
            const transaction = await posService.createTransaction(
                payload,
                idempotencyKeyRef.current ?? undefined,
            );
            setLastTransaction({
                transactionNumber: transaction.transactionNumber,
                total: Number(transaction.total),
            });
            setCart([]);
            setShowPaymentModal(false);
            setDiscountAmount(0);
            setCashTendered('');
            // Return focus to the search input so the cashier can scan the next sale
            // immediately. Wait one frame so the modal's own focus restore runs first.
            requestAnimationFrame(() => searchInputRef.current?.focus());
        } catch {
            setError('Failed to complete sale. Please try again.');
        } finally {
            setIsCheckingOut(false);
            checkoutInFlightRef.current = false;
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
        <div className="h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7.5rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Status bars */}
                <div role="status" aria-live="polite" aria-atomic="true" className="contents">
                    {scanStatus && (
                        <div className="px-4 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text-1 font-medium animate-in fade-in duration-200">
                            {scanStatus}
                        </div>
                    )}
                    {pendingQty && (
                        <div className="px-4 py-2 bg-primary-soft border border-border-strong rounded-xl text-sm text-text-1 font-bold animate-in fade-in duration-200 flex items-center justify-between">
                            <span>Quantity: {pendingQty}x — Now scan or select a product</span>
                            <button
                                onClick={() => setPendingQty(null)}
                                aria-label="Cancel pending quantity"
                                className="text-text-2 hover:text-text-1 text-xs underline"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Search Bar + Scan Button */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-2">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </div>
                        <input
                            ref={searchInputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-14 pl-12 pr-24 bg-surface border border-border rounded-md text-lg text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 shadow-xl"
                            placeholder="Scan barcode or search product..."
                            autoFocus
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {search && (
                                <button onClick={() => { setSearch(''); setSearchResults([]); }} className="p-1 text-text-3 hover:text-text-1 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                            <kbd className="hidden sm:inline-flex items-center justify-center h-7 px-2.5 rounded border border-border-strong bg-surface-2 text-[11px] font-bold text-text-2">F2</kbd>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCameraScanner(true)}
                        className="h-14 w-14 flex-shrink-0 bg-surface border border-border rounded-md flex items-center justify-center text-text-2 hover:text-text-1 hover:border-border-strong hover:bg-surface-2 transition-all shadow-xl"
                        title="Scan with camera"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </button>
                    <Link
                        to={FRONTEND_ROUTES.SCAN_REQUEST}
                        className="h-14 px-4 flex-shrink-0 bg-surface border border-border rounded-md flex items-center gap-2 text-text-1 hover:text-text-1 hover:border-border-strong hover:bg-surface-2 transition-all shadow-xl text-sm font-semibold"
                        title="Scan a customer pickup QR"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <path d="M14 14h3v3M21 14v.01M14 21v.01M17 21h.01M21 17h.01M21 21h.01" />
                        </svg>
                        Pickup
                    </Link>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto rounded-md">
                    {isSearching ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
                                    <div className="h-4 w-3/4 bg-surface-2 rounded mb-3" />
                                    <div className="h-3 w-1/2 bg-surface-2 rounded mb-4" />
                                    <div className="h-6 w-1/3 bg-surface-2 rounded" />
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
                                        className="bg-surface border border-border rounded-xl p-4 text-left hover:bg-surface-2 hover:border-border-strong transition-all group relative"
                                    >
                                        {inCart && (
                                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-primary text-text-inv rounded-full w-5 h-5 flex items-center justify-center">
                                                {inCart.quantity}
                                            </span>
                                        )}
                                        {pendingQty && (
                                            <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary-soft text-text-1 rounded px-1.5 py-0.5">
                                                {pendingQty}x
                                            </span>
                                        )}
                                        <p className="text-sm font-semibold text-text-1 truncate mb-1">{product.name}</p>
                                        <p className="text-[11px] text-text-3 mb-1 truncate">{product.category}</p>
                                        <p className="text-[11px] text-text-3 mb-3 font-mono">{product.barcode}</p>
                                        <p className="text-sm font-bold text-text-1 tabular-nums">{formatCurrency(Number(product.sellingPrice))}</p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : search.trim() && !isSearching ? (
                        <div className="bg-surface border border-border rounded-md flex flex-col items-center justify-center p-12 h-full">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-3 mb-3" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <p className="text-sm text-text-2">No products found for "{search}"</p>
                        </div>
                    ) : (
                        <div className="bg-surface border border-border rounded-md shadow-2xl flex flex-col items-center justify-center p-8 h-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-surface-2 blur-xl rounded-full" />
                                    <div className="w-20 h-20 bg-surface-2 border border-border rounded-3xl flex items-center justify-center relative z-10">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                            <line x1="7" y1="7" x2="7" y2="17" /><line x1="12" y1="7" x2="12" y2="17" /><line x1="17" y1="7" x2="17" y2="17" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-text-1 mb-2 tracking-tight">Ready to Scan</h3>
                                <p className="text-sm text-text-2 max-w-[280px]">Scan a barcode or search by name to add items to the cart.</p>
                                <div className="flex items-center gap-4 mt-6 text-[11px] text-text-3">
                                    <span><kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-2 font-bold">F2</kbd> Search</span>
                                    <span><kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-2 font-bold">F12</kbd> Checkout</span>
                                    <span><kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-2 font-bold">ESC</kbd> Close</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Cart (invoice table) → Totals → Calculator → Checkout */}
            <div className="w-[440px] bg-surface border border-border rounded-md shadow-md-token flex flex-col flex-shrink-0">

                {/* Header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-semibold">Point of Sale</p>
                        <h2 className="text-base font-bold text-text-1 tracking-tight mt-0.5">Current sale</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {totalItems > 0 && (
                            <span className="text-[11px] font-semibold bg-primary-soft text-primary-soft-text rounded-full px-2 py-0.5 tabular-nums">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                        )}
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-[11px] font-semibold text-text-3 hover:text-danger uppercase tracking-wider transition-colors focus:outline-none focus:ring-[3px] focus:ring-danger/20 rounded px-1"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Invoice table — Product / Qty / Price */}
                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[160px] text-center">
                        <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-3" strokeWidth="1.5">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-text-2">Cart is empty</p>
                        <p className="text-xs text-text-3 mt-1">Scan a barcode or search to add products.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-[140px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-surface z-[1]">
                                <tr className="text-[10px] uppercase tracking-[0.1em] text-text-3 border-b border-border">
                                    <th className="px-5 py-2 font-semibold">Product</th>
                                    <th className="px-2 py-2 font-semibold text-center w-[88px]">Qty</th>
                                    <th className="px-5 py-2 font-semibold text-right w-[96px]">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item) => (
                                    <tr
                                        key={item.product.id}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 group transition-colors align-top"
                                    >
                                        <td className="px-5 py-3 min-w-0">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-medium text-text-1 truncate leading-tight">
                                                        {item.isCustom && (
                                                            <span className="text-text-3 mr-1 text-[10px] uppercase tracking-wider">Custom</span>
                                                        )}
                                                        {item.product.name}
                                                    </p>
                                                    <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                                                        {item.isCustom ? '—' : (item.product.barcode || item.product.id.slice(0, 10))}
                                                        <span className="ml-2 text-text-3">{formatCurrency(item.unitPrice)} ea</span>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    aria-label={`Remove ${item.product.name}`}
                                                    className="p-1 -mt-0.5 -mr-1 rounded text-text-3 hover:text-danger hover:bg-danger-soft opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none focus:ring-[3px] focus:ring-danger/20"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-1 py-3 text-center align-middle">
                                            <div className="inline-flex items-center gap-0.5 bg-canvas border border-border rounded-md p-0.5">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    aria-label="Decrease quantity"
                                                    className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center text-sm font-bold leading-none"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        if (v === '') return;
                                                        const n = parseInt(v, 10);
                                                        if (!Number.isNaN(n)) updateQuantity(item.product.id, n);
                                                    }}
                                                    aria-label={`Quantity for ${item.product.name}`}
                                                    className="w-7 h-6 text-center bg-transparent text-text-1 text-[13px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    aria-label="Increase quantity"
                                                    className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center text-sm font-bold leading-none"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right tabular-nums align-middle">
                                            <span className="text-[13px] font-semibold text-text-1">
                                                {formatCurrency(item.lineTotal)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Status banners */}
                {(error || lastTransaction) && (
                    <div className="px-5 pt-3 space-y-2">
                        {error && (
                            <div
                                role="alert"
                                aria-live="assertive"
                                className="p-2.5 bg-danger-soft border border-danger/30 rounded-md text-xs text-danger flex items-start gap-2"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span className="flex-1">{error}</span>
                            </div>
                        )}
                        {lastTransaction && (
                            <div
                                role="status"
                                aria-live="polite"
                                className="p-2.5 bg-accent-soft border border-accent/30 rounded-md flex items-start gap-2"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 flex-shrink-0 text-accent-text">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-accent-text">
                                        Sale complete · {lastTransaction.transactionNumber}
                                    </p>
                                    <p className="text-[11px] text-text-2 mono mt-0.5">
                                        {formatCurrency(lastTransaction.total)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLastTransaction(null)}
                                    aria-label="Dismiss"
                                    className="p-0.5 text-text-3 hover:text-text-1 -mt-0.5 -mr-0.5 rounded focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Totals card */}
                <div className="px-5 py-4 border-t border-border bg-surface-2/40 space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-text-2">Subtotal</span>
                        <span className="text-text-1 tabular-nums mono">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountValue > 0 && (
                        <div className="flex items-center justify-between text-[13px]">
                            <span className="flex items-center gap-1.5 text-text-2">
                                Total Discount
                                {discountType === 'percentage' && discountAmount > 0 && (
                                    <span className="text-[10px] font-semibold text-text-3 bg-canvas border border-border rounded px-1 py-0.5 mono">
                                        −{discountAmount}%
                                    </span>
                                )}
                                <button
                                    onClick={() => setDiscountAmount(0)}
                                    aria-label="Clear discount"
                                    className="p-0.5 -ml-0.5 text-text-3 hover:text-danger rounded focus:outline-none focus:ring-[2px] focus:ring-danger/20"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </span>
                            <span className="text-danger tabular-nums mono">−{formatCurrency(discountValue)}</span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-border flex items-end justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3 pb-0.5">
                            Total · LKR
                        </span>
                        <span className="text-2xl font-bold text-text-1 tabular-nums tracking-tight leading-none mono">
                            {formatCurrency(total).replace('LKR', '').trim()}
                        </span>
                    </div>
                </div>

                {/* Calculator pad — compact mode strip + numpad only when active */}
                <div className="border-t border-border">
                    <div className="grid grid-cols-3 gap-1 p-2">
                        {([
                            { mode: 'qty' as PadMode, label: 'Qty', title: 'Set quantity before adding product' },
                            { mode: 'disc' as PadMode, label: 'Discount', title: 'Apply discount to bill' },
                            { mode: 'custom' as PadMode, label: 'Custom item', title: 'Add custom item' },
                        ] as const).map((btn) => {
                            const active = padMode === btn.mode;
                            return (
                                <button
                                    key={btn.mode}
                                    onClick={() => {
                                        if (active) { setPadMode('idle'); setPadValue(''); setCustomName(''); }
                                        else { setPadMode(btn.mode); setPadValue(''); setCustomName(''); }
                                    }}
                                    title={btn.title}
                                    aria-pressed={active}
                                    className={`h-8 rounded-md text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 ${
                                        active
                                            ? 'bg-primary text-text-inv'
                                            : 'bg-surface-2 border border-border text-text-2 hover:text-text-1 hover:bg-primary-soft'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>

                    {padMode !== 'idle' && (
                        <div className="px-2 pb-2">
                            <div className="flex items-center justify-between h-6 mb-1.5 px-1">
                                <p className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">{modeLabel[padMode]}</p>
                                {padMode === 'disc' ? (
                                    <button
                                        onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                                        className="text-[10px] font-semibold text-text-2 hover:text-text-1 px-2 py-0.5 rounded bg-surface-2 border border-border transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/20"
                                    >
                                        Switch to {discountType === 'fixed' ? '%' : 'LKR'}
                                    </button>
                                ) : (
                                    <span aria-hidden="true" className="invisible text-[10px] px-2 py-0.5">placeholder</span>
                                )}
                            </div>

                            {padMode === 'custom' && (
                                <input
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Item name…"
                                    aria-label="Custom item name"
                                    className="w-full h-9 px-3 mb-1.5 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 transition-colors"
                                />
                            )}

                            <div className="h-10 px-3 bg-canvas border border-border rounded-md flex items-center justify-end mb-1.5">
                                <span className="text-lg font-bold text-text-1 tabular-nums tracking-tight mono">
                                    {padMode === 'disc' && discountType === 'percentage' && padValue ? `${padValue}%` : padValue || '0'}
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1">
                                {['7','8','9','C','4','5','6','.','1','2','3',''].map((key, i) => (
                                    key ? (
                                        <button
                                            key={key + i}
                                            onClick={() => padPress(key)}
                                            aria-label={key === 'C' ? 'Clear' : `Digit ${key}`}
                                            className={`h-9 rounded-md text-sm font-bold transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 ${
                                                key === 'C'
                                                    ? 'bg-danger-soft text-danger hover:bg-danger-soft border border-danger/30'
                                                    : 'bg-surface-2 border border-border text-text-1 hover:bg-primary-soft'
                                            }`}
                                        >
                                            {key}
                                        </button>
                                    ) : <div key={i} />
                                ))}
                                <button
                                    onClick={() => padPress('0')}
                                    aria-label="Digit 0"
                                    className="h-9 rounded-md text-sm font-bold bg-surface-2 border border-border text-text-1 hover:bg-primary-soft transition-colors col-span-2 focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                                >
                                    0
                                </button>
                                <button
                                    onClick={padConfirm}
                                    className="h-9 rounded-md text-sm font-bold bg-primary text-text-inv hover:bg-primary-hover transition-colors col-span-2 focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                                >
                                    {padMode === 'qty' ? 'Set qty' : padMode === 'disc' ? 'Apply' : 'Add'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Complete Sale */}
                <div className="p-3 border-t border-border bg-surface">
                    <button
                        onClick={() => { setShowPaymentModal(true); setCashTendered(''); }}
                        disabled={cart.length === 0}
                        className="w-full h-12 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span>Complete Sale</span>
                        {cart.length > 0 && (
                            <span className="tabular-nums mono opacity-90">· {formatCurrency(total)}</span>
                        )}
                        <kbd className="ml-1 inline-flex items-center justify-center h-5 px-1.5 rounded bg-text-inv/10 text-[10px] font-bold">F12</kbd>
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Complete Sale"
                maxWidth="md"
            >
                <div>
                            {/* Order Summary */}
                            <div className="mb-5 p-4 bg-surface-2 rounded-xl border border-border">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-text-2">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                                    <span className="text-text-1 tabular-nums">{formatCurrency(subtotal)}</span>
                                </div>
                                {discountValue > 0 && (
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-2">Discount</span>
                                        <span className="text-text-1 tabular-nums">-{formatCurrency(discountValue)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end pt-2 border-t border-border">
                                    <span className="text-sm font-semibold text-text-1">Total</span>
                                    <span className="text-xl font-bold text-text-1 tabular-nums">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-3">Payment Method</p>
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
                                                ? 'bg-primary text-text-inv border-primary'
                                                : 'bg-surface-2 text-text-2 border-border hover:border-border-strong hover:text-text-1'
                                        }`}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={method.icon} /></svg>
                                        <span className="text-xs font-bold">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cash Change Calculator */}
                            {paymentMethod === 'cash' && (
                                <div className="mb-5 p-4 bg-surface-2 rounded-xl border border-border">
                                    <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Cash Received</p>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={cashTendered}
                                        onChange={(e) => setCashTendered(e.target.value)}
                                        placeholder={total.toFixed(2)}
                                        className="w-full h-12 px-4 bg-canvas border border-border rounded-lg text-xl text-text-1 font-bold tabular-nums outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        autoFocus
                                    />
                                    {/* Quick cash buttons */}
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {[100, 500, 1000, 5000].map((amt) => (
                                            <button
                                                key={amt}
                                                onClick={() => setCashTendered(String(amt))}
                                                className="h-8 rounded-lg bg-surface-2 border border-border text-xs font-bold text-text-1 hover:text-text-1 hover:bg-primary-soft transition-colors tabular-nums"
                                            >
                                                {amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    {cashTendered && parseFloat(cashTendered) >= total && (
                                        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                                            <span className="text-sm font-semibold text-text-2">Change Due</span>
                                            <span className="text-2xl font-bold text-text-1 tabular-nums">{formatCurrency(cashChange)}</span>
                                        </div>
                                    )}
                                    {cashTendered && parseFloat(cashTendered) < total && (
                                        <p className="mt-2 text-xs text-danger">Insufficient amount — need {formatCurrency(total - parseFloat(cashTendered))} more</p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-lg text-sm text-danger">{error}</div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut || (paymentMethod === 'cash' && !!cashTendered && parseFloat(cashTendered) < total)}
                                className="w-full h-12 rounded-xl bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCheckingOut ? (
                                    <><div className="w-4 h-4 border-2 border-border-strong border-t-primary rounded-full animate-spin" />Processing...</>
                                ) : (
                                    <>Confirm {formatCurrency(total)}</>
                                )}
                            </button>
                </div>
            </Modal>

            {/* Camera Scanner Modal */}
            <Modal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                title="Scan barcode"
                maxWidth="lg"
            >
                <UniversalScanner
                    onScanSuccess={(scannedBarcode) => {
                        handleBarcodeScan(scannedBarcode);
                        setShowCameraScanner(false);
                    }}
                />
            </Modal>
        </div>
    );
}
