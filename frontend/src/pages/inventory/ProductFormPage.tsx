import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { inventoryService } from '@/services/inventory.service';
import { useScanDetection } from '@/hooks/useScanDetection';
import { useAuth } from '@/hooks/useAuth';
import UniversalScanner from '@/components/Scanner/UniversalScanner';

interface FormErrors {
    name?: string;
    barcode?: string;
    category?: string;
    costPrice?: string;
    sellingPrice?: string;
    initialStock?: string;
    lowStockThreshold?: string;
    general?: string;
}

export default function ProductFormPage() {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const { user } = useAuth();
    const isEditMode = Boolean(productId);

    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [initialStock, setInitialStock] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [categories, setCategories] = useState<string[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);
    const [scanDetected, setScanDetected] = useState(false);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'looking' | 'found' | 'new'>('idle');

    // Look up barcode in database and auto-fill form if product exists
    const lookupBarcode = useCallback(async (scannedBarcode: string) => {
        setBarcode(scannedBarcode);
        setScanDetected(true);
        setTimeout(() => setScanDetected(false), 2000);

        if (isEditMode || scannedBarcode.length < 4) return;

        setBarcodeStatus('looking');
        const product = await inventoryService.getProductByBarcode(scannedBarcode);

        if (product) {
            setName(product.name);
            setCategory(product.category);
            setDescription(product.description || '');
            setCostPrice(String(product.costPrice));
            setSellingPrice(String(product.sellingPrice));
            setBarcodeStatus('found');
        } else {
            setBarcodeStatus('new');
        }

        setTimeout(() => setBarcodeStatus('idle'), 3000);
    }, [isEditMode]);

    // USB barcode scanner detection
    useScanDetection({
        onScan: lookupBarcode,
        minLength: 6,
    });

    // Load categories
    useEffect(() => {
        inventoryService.getCategories().then(setCategories).catch(() => {});
    }, []);

    // Load product data for edit mode
    const loadProduct = useCallback((id: string) => {
        setIsLoadingProduct(true);
        inventoryService
            .getProductById(id)
            .then((product) => {
                setName(product.name);
                setBarcode(product.barcode);
                setDescription(product.description || '');
                setCategory(product.category);
                setCostPrice(String(product.costPrice));
                setSellingPrice(String(product.sellingPrice));
            })
            .catch(() => {
                setErrors({ general: 'Failed to load product' });
            })
            .finally(() => setIsLoadingProduct(false));
    }, []);

    useEffect(() => {
        if (productId) loadProduct(productId);
    }, [productId, loadProduct]);

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!name.trim()) newErrors.name = 'Product name is required';
        if (!barcode.trim()) newErrors.barcode = 'Barcode is required';
        if (!category.trim()) newErrors.category = 'Category is required';
        const cost = parseFloat(costPrice);
        const sell = parseFloat(sellingPrice);
        if (isNaN(cost) || cost < 0) newErrors.costPrice = 'Cost price must be a positive number';
        if (isNaN(sell) || sell < 0) newErrors.sellingPrice = 'Selling price must be a positive number';
        if (!isEditMode) {
            const qty = parseInt(initialStock, 10);
            if (initialStock !== '' && (isNaN(qty) || qty < 0)) newErrors.initialStock = 'Stock must be 0 or more';
            const threshold = parseInt(lowStockThreshold, 10);
            if (isNaN(threshold) || threshold < 1) newErrors.lowStockThreshold = 'Threshold must be at least 1';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        setErrors({});

        const payload = {
            name: name.trim(),
            barcode: barcode.trim(),
            description: description.trim() || undefined,
            category: category.trim(),
            costPrice: parseFloat(costPrice),
            sellingPrice: parseFloat(sellingPrice),
        };

        try {
            if (isEditMode && productId) {
                await inventoryService.updateProduct(productId, payload);
            } else {
                const product = await inventoryService.createProduct(payload);
                if (user?.branchId) {
                    await inventoryService.createInventory({
                        productId: product.id,
                        branchId: user.branchId,
                        quantity: initialStock ? parseInt(initialStock, 10) : 0,
                        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
                    });
                }
            }
            navigate(FRONTEND_ROUTES.INVENTORY);
        } catch (err: unknown) {
            if (
                err &&
                typeof err === 'object' &&
                'response' in err &&
                (err as { response?: { status?: number } }).response?.status === 409
            ) {
                setErrors({ barcode: 'A product with this barcode already exists' });
            } else {
                setErrors({ general: 'Failed to save product. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingProduct) {
        return (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8">
                    <div className="h-4 w-32 bg-primary-soft rounded animate-pulse mb-4" />
                    <div className="h-8 w-64 bg-primary-soft rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-primary-soft rounded animate-pulse" />
                </div>
                <div className="bg-surface border border-border rounded-md shadow-2xl p-8">
                    <div className="space-y-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-11 bg-surface-2 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Back Navigation */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(FRONTEND_ROUTES.INVENTORY)}
                    className="text-sm text-text-2 hover:text-text-1 transition-colors flex items-center gap-2 mb-4 font-medium"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to Inventory
                </button>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    {isEditMode ? 'Update the details for this product.' : 'Enter the details for your new inventory item.'}
                </p>
            </div>

            {errors.general && (
                <div className="mb-6 p-4 bg-danger-soft border border-danger/30 rounded-xl text-sm text-danger">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
                    <div className="p-8 space-y-8">

                        {/* Section 1: General Info */}
                        <div>
                            <h2 className="text-lg font-semibold text-text-1 mb-5 pb-2 border-b border-border">
                                General Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                        Product Name
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`w-full h-11 px-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 ${errors.name ? 'border-red-500/50' : 'border-border'}`}
                                        placeholder="e.g. Premium Wireless Headphones"
                                    />
                                    {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                        Category
                                    </label>
                                    <div className="relative">
                                        <input
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            list="category-list"
                                            className={`w-full h-11 px-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 ${errors.category ? 'border-red-500/50' : 'border-border'}`}
                                            placeholder="Select or type a category..."
                                        />
                                        <datalist id="category-list">
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                    {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                        Barcode / UPC
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                value={barcode}
                                                onChange={(e) => setBarcode(e.target.value)}
                                                onBlur={() => { if (barcode.trim().length >= 4 && !isEditMode) lookupBarcode(barcode.trim()); }}
                                                className={`w-full h-11 px-4 pr-28 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 font-mono tracking-wider ${errors.barcode ? 'border-red-500/50' : barcodeStatus === 'found' ? 'border-green-500/50 ring-[3px] ring-green-500/20' : scanDetected ? 'border-green-500/50 ring-[3px] ring-green-500/20' : 'border-border'}`}
                                                placeholder="Scan or type barcode"
                                            />
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md transition-all ${
                                                barcodeStatus === 'looking' ? 'bg-warning-soft text-warning border border-yellow-500/30' :
                                                barcodeStatus === 'found' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                barcodeStatus === 'new' ? 'bg-info-soft text-info border border-info/40' :
                                                scanDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                'bg-surface-2 text-text-3 border border-border'
                                            }`}>
                                                {barcodeStatus === 'looking' ? 'Looking up...' :
                                                 barcodeStatus === 'found' ? 'Product found' :
                                                 barcodeStatus === 'new' ? 'New product' :
                                                 scanDetected ? 'Scanned' : 'Scanner ready'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCameraScanner(true)}
                                            className="h-11 px-3 rounded-xl border border-border bg-canvas text-text-2 hover:text-text-1 hover:border-primary/40 hover:bg-surface-2 transition-all flex items-center gap-2 shrink-0"
                                            title="Scan with camera"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                                <circle cx="12" cy="13" r="4"/>
                                            </svg>
                                            <span className="text-xs font-medium hidden sm:inline">Camera</span>
                                        </button>
                                    </div>
                                    {errors.barcode && <p className="text-xs text-danger mt-1">{errors.barcode}</p>}
                                    <p className="text-[11px] text-text-3 mt-2">Scan or type a barcode — if the product exists, details will auto-fill.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Description */}
                        <div>
                            <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                Description (optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 resize-none"
                                placeholder="Brief product description..."
                            />
                        </div>

                        {/* Section 3: Initial Stock (create mode only) */}
                        {!isEditMode && (
                            <div>
                                <h2 className="text-lg font-semibold text-text-1 mb-5 pb-2 border-b border-border">
                                    Stock Details
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                            Initial Stock Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={initialStock}
                                            onChange={(e) => setInitialStock(e.target.value)}
                                            className={`w-full h-11 px-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 tabular-nums ${errors.initialStock ? 'border-red-500/50' : 'border-border'}`}
                                            placeholder="0"
                                        />
                                        {errors.initialStock && <p className="text-xs text-danger mt-1">{errors.initialStock}</p>}
                                        <p className="text-[11px] text-text-3 mt-2">How many units are you adding to inventory right now?</p>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                            Low Stock Alert Threshold
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={lowStockThreshold}
                                            onChange={(e) => setLowStockThreshold(e.target.value)}
                                            className={`w-full h-11 px-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 tabular-nums ${errors.lowStockThreshold ? 'border-red-500/50' : 'border-border'}`}
                                            placeholder="10"
                                        />
                                        {errors.lowStockThreshold && <p className="text-xs text-danger mt-1">{errors.lowStockThreshold}</p>}
                                        <p className="text-[11px] text-text-3 mt-2">You'll get an alert when stock drops to this level.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 4: Pricing */}
                        <div>
                            <h2 className="text-lg font-semibold text-text-1 mb-5 pb-2 border-b border-border">
                                Pricing Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                        Cost Price
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 text-sm font-medium">Rs</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={costPrice}
                                            onChange={(e) => setCostPrice(e.target.value)}
                                            className={`w-full h-11 pl-10 pr-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 tabular-nums ${errors.costPrice ? 'border-red-500/50' : 'border-border'}`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.costPrice && <p className="text-xs text-danger mt-1">{errors.costPrice}</p>}
                                    <p className="text-[11px] text-text-3 mt-2">Your internal purchase cost.</p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-text-2 mb-2 uppercase tracking-[1px]">
                                        Selling Price
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 text-sm font-medium">Rs</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={sellingPrice}
                                            onChange={(e) => setSellingPrice(e.target.value)}
                                            className={`w-full h-11 pl-10 pr-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-text-3 tabular-nums ${errors.sellingPrice ? 'border-red-500/50' : 'border-border'}`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.sellingPrice && <p className="text-xs text-danger mt-1">{errors.sellingPrice}</p>}
                                    <p className="text-[11px] text-text-3 mt-2">Customer facing price.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border bg-surface-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(FRONTEND_ROUTES.INVENTORY)}
                            className="h-10 px-5 rounded-xl border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-10 px-6 rounded-xl bg-primary text-text-inv text-sm font-bold tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Camera Scanner Modal */}
            {showCameraScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <UniversalScanner
                            onScanSuccess={(scannedBarcode) => {
                                lookupBarcode(scannedBarcode);
                                setShowCameraScanner(false);
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowCameraScanner(false)}
                            className="mt-3 w-full h-10 rounded-xl border border-border bg-surface text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
                        >
                            Close Scanner
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
