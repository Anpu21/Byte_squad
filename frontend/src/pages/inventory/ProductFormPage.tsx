import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Camera,
    Image as ImageIcon,
    Package,
    Save,
    Scan,
    Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { inventoryService } from '@/services/inventory.service';
import { useScanDetection } from '@/hooks/useScanDetection';
import { useAuth } from '@/hooks/useAuth';
import UniversalScanner from '@/components/Scanner/UniversalScanner';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';

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

const FIELD_FOCUS_ORDER: (keyof FormErrors)[] = [
    'name',
    'category',
    'barcode',
    'sellingPrice',
    'costPrice',
    'initialStock',
    'lowStockThreshold',
];

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2,
    }).format(amount);
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
    const [barcodeStatus, setBarcodeStatus] = useState<
        'idle' | 'looking' | 'found' | 'new'
    >('idle');

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const lookupBarcode = useCallback(
        async (scannedBarcode: string) => {
            setBarcode(scannedBarcode);
            setScanDetected(true);
            setTimeout(() => setScanDetected(false), 2000);

            if (isEditMode || scannedBarcode.length < 4) return;

            setBarcodeStatus('looking');
            const product = await inventoryService.getProductByBarcode(
                scannedBarcode,
            );

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
        },
        [isEditMode],
    );

    useScanDetection({
        onScan: lookupBarcode,
        minLength: 6,
    });

    useEffect(() => {
        inventoryService.getCategories().then(setCategories).catch(() => {});
    }, []);

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
                setImageUrl(product.imageUrl);
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
        if (isNaN(cost) || cost < 0)
            newErrors.costPrice = 'Cost price must be a positive number';
        if (isNaN(sell) || sell < 0)
            newErrors.sellingPrice = 'Selling price must be a positive number';
        if (!isEditMode) {
            const qty = parseInt(initialStock, 10);
            if (initialStock !== '' && (isNaN(qty) || qty < 0))
                newErrors.initialStock = 'Stock must be 0 or more';
            const threshold = parseInt(lowStockThreshold, 10);
            if (isNaN(threshold) || threshold < 1)
                newErrors.lowStockThreshold = 'Threshold must be at least 1';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const focusFirstInvalid = (newErrors: FormErrors) => {
        const firstKey = FIELD_FOCUS_ORDER.find((k) => newErrors[k]);
        if (!firstKey) return;
        requestAnimationFrame(() => {
            const form = document.getElementById('product-form');
            const el = form?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus({ preventScroll: true });
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            // re-derive the errors snapshot used by validate to focus first invalid
            const snapshot: FormErrors = {};
            if (!name.trim()) snapshot.name = '1';
            if (!category.trim()) snapshot.category = '1';
            if (!barcode.trim()) snapshot.barcode = '1';
            if (isNaN(parseFloat(sellingPrice)) || parseFloat(sellingPrice) < 0) snapshot.sellingPrice = '1';
            if (isNaN(parseFloat(costPrice)) || parseFloat(costPrice) < 0) snapshot.costPrice = '1';
            if (!isEditMode) {
                const qty = parseInt(initialStock, 10);
                if (initialStock !== '' && (isNaN(qty) || qty < 0)) snapshot.initialStock = '1';
                const threshold = parseInt(lowStockThreshold, 10);
                if (isNaN(threshold) || threshold < 1) snapshot.lowStockThreshold = '1';
            }
            focusFirstInvalid(snapshot);
            return;
        }

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
                if (pendingImageFile) {
                    try {
                        await inventoryService.uploadProductImage(
                            product.id,
                            pendingImageFile,
                        );
                    } catch {
                        toast.error(
                            'Product saved but image upload failed. Edit the product to retry.',
                        );
                    }
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
                setErrors({
                    barcode: 'A product with this barcode already exists',
                });
            } else {
                setErrors({
                    general: 'Failed to save product. Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelected = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be 2 MB or smaller.');
            return;
        }
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
            toast.error('JPG, PNG, WebP, or GIF only.');
            return;
        }

        if (isEditMode && productId) {
            setUploadingImage(true);
            try {
                const updated = await inventoryService.uploadProductImage(
                    productId,
                    file,
                );
                setImageUrl(updated.imageUrl);
                toast.success('Image uploaded');
            } catch {
                toast.error('Image upload failed');
            } finally {
                setUploadingImage(false);
            }
        } else {
            // Create mode: stash file, show local preview, upload after save.
            setPendingImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setImageUrl(String(reader.result));
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = async () => {
        if (isEditMode && productId) {
            setUploadingImage(true);
            try {
                await inventoryService.deleteProductImage(productId);
                setImageUrl(null);
            } catch {
                toast.error('Failed to remove image');
            } finally {
                setUploadingImage(false);
            }
        } else {
            setPendingImageFile(null);
            setImageUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Margin / Markup auto-calc
    const cost = parseFloat(costPrice);
    const sell = parseFloat(sellingPrice);
    const validPrices = !isNaN(cost) && !isNaN(sell) && cost > 0 && sell > 0;
    const marginPct = validPrices ? ((sell - cost) / sell) * 100 : null;
    const markupPct = validPrices ? ((sell - cost) / cost) * 100 : null;
    const profitAbs = validPrices ? sell - cost : null;

    if (isLoadingProduct) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate(FRONTEND_ROUTES.INVENTORY)}
                        className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text-1 transition-colors mb-2"
                    >
                        <ArrowLeft size={12} /> Back to inventory
                    </button>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        {isEditMode ? 'Edit product' : 'Add new product'}
                    </h1>
                    <p className="text-xs text-text-2 mt-1">
                        {isEditMode
                            ? 'Update the details for this product.'
                            : 'Enter the details for your new inventory item.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => navigate(FRONTEND_ROUTES.INVENTORY)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="product-form"
                        size="md"
                        disabled={isSubmitting}
                    >
                        <Save size={14} />
                        {isSubmitting
                            ? 'Saving…'
                            : isEditMode
                              ? 'Save product'
                              : 'Create product'}
                    </Button>
                </div>
            </div>

            {errors.general && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {errors.general}
                </div>
            )}

            <form
                id="product-form"
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
                {/* Left: Basics + Pricing + Stock */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Basics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basics</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Name
                                </label>
                                <input
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    aria-invalid={!!errors.name}
                                    className={`w-full h-[38px] px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                                        errors.name
                                            ? 'border-danger'
                                            : 'border-border-strong hover:border-text-3'
                                    }`}
                                    placeholder="e.g. Coca-Cola 1L PET"
                                />
                                {errors.name && (
                                    <p className="text-xs text-danger mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Category
                                </label>
                                <input
                                    name="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    list="category-list"
                                    aria-invalid={!!errors.category}
                                    className={`w-full h-[38px] px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                                        errors.category
                                            ? 'border-danger'
                                            : 'border-border-strong hover:border-text-3'
                                    }`}
                                    placeholder="Select or type a category"
                                />
                                <datalist id="category-list">
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                                {errors.category && (
                                    <p className="text-xs text-danger mt-1">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Barcode / SKU
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            name="barcode"
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            aria-invalid={!!errors.barcode}
                                            onBlur={() => {
                                                if (
                                                    barcode.trim().length >= 4 &&
                                                    !isEditMode
                                                )
                                                    lookupBarcode(barcode.trim());
                                            }}
                                            className={`w-full h-[38px] px-3 pr-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono ${
                                                errors.barcode
                                                    ? 'border-danger'
                                                    : barcodeStatus === 'found' ||
                                                        scanDetected
                                                      ? 'border-accent'
                                                      : 'border-border-strong hover:border-text-3 focus:border-primary focus:ring-[3px] focus:ring-primary/30'
                                            }`}
                                            placeholder="Scan or type barcode"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCameraScanner(true)}
                                        className="h-[38px] w-[38px] flex items-center justify-center rounded-md border border-border-strong text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors"
                                        title="Scan with camera"
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>
                                {(barcodeStatus !== 'idle' || scanDetected) && (
                                    <div className="mt-1.5">
                                        {barcodeStatus === 'looking' && (
                                            <Pill tone="warning">Looking up…</Pill>
                                        )}
                                        {barcodeStatus === 'found' && (
                                            <Pill tone="success">
                                                Product details auto-filled
                                            </Pill>
                                        )}
                                        {barcodeStatus === 'new' && (
                                            <Pill tone="info">New product</Pill>
                                        )}
                                        {scanDetected &&
                                            barcodeStatus === 'idle' && (
                                                <Pill tone="success">
                                                    Scanned
                                                </Pill>
                                            )}
                                    </div>
                                )}
                                {errors.barcode && (
                                    <p className="text-xs text-danger mt-1">
                                        {errors.barcode}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 resize-none transition-colors"
                                    placeholder="Brief product description"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Selling price (LKR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-xs font-medium">
                                        Rs
                                    </span>
                                    <input
                                        name="sellingPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={sellingPrice}
                                        onChange={(e) =>
                                            setSellingPrice(e.target.value)
                                        }
                                        aria-invalid={!!errors.sellingPrice}
                                        className={`w-full h-[38px] pl-9 pr-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                                            errors.sellingPrice
                                                ? 'border-danger'
                                                : 'border-border-strong hover:border-text-3'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.sellingPrice && (
                                    <p className="text-xs text-danger mt-1">
                                        {errors.sellingPrice}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-2 mb-1.5">
                                    Cost price (LKR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-xs font-medium">
                                        Rs
                                    </span>
                                    <input
                                        name="costPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={costPrice}
                                        onChange={(e) =>
                                            setCostPrice(e.target.value)
                                        }
                                        className={`w-full h-[38px] pl-9 pr-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                                            errors.costPrice
                                                ? 'border-danger'
                                                : 'border-border-strong hover:border-text-3'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.costPrice && (
                                    <p className="text-xs text-danger mt-1">
                                        {errors.costPrice}
                                    </p>
                                )}
                            </div>

                            {marginPct !== null && markupPct !== null && (
                                <div className="sm:col-span-2 flex items-center gap-4 px-3 py-2.5 rounded-md bg-surface-2 text-xs text-text-2">
                                    <span>
                                        Margin{' '}
                                        <span className="mono font-semibold text-text-1">
                                            {marginPct.toFixed(1)}%
                                        </span>
                                    </span>
                                    <span className="text-text-3">·</span>
                                    <span>
                                        Markup{' '}
                                        <span className="mono font-semibold text-text-1">
                                            {markupPct.toFixed(1)}%
                                        </span>
                                    </span>
                                    <span className="text-text-3">·</span>
                                    <span>
                                        Profit{' '}
                                        <span className="mono font-semibold text-text-1">
                                            {formatCurrency(profitAbs ?? 0)}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock (create mode only — backend per-branch stock not loaded for edit) */}
                    {!isEditMode && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                                        Initial stock quantity
                                    </label>
                                    <input
                                        name="initialStock"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={initialStock}
                                        onChange={(e) =>
                                            setInitialStock(e.target.value)
                                        }
                                        aria-invalid={!!errors.initialStock}
                                        className={`w-full h-[38px] px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                                            errors.initialStock
                                                ? 'border-danger'
                                                : 'border-border-strong hover:border-text-3'
                                        }`}
                                        placeholder="0"
                                    />
                                    <p className="text-[11px] text-text-3 mt-1">
                                        Units to add at this branch right now.
                                    </p>
                                    {errors.initialStock && (
                                        <p className="text-xs text-danger mt-1">
                                            {errors.initialStock}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                                        Low-stock threshold
                                    </label>
                                    <input
                                        name="lowStockThreshold"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={lowStockThreshold}
                                        onChange={(e) =>
                                            setLowStockThreshold(e.target.value)
                                        }
                                        aria-invalid={!!errors.lowStockThreshold}
                                        className={`w-full h-[38px] px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                                            errors.lowStockThreshold
                                                ? 'border-danger'
                                                : 'border-border-strong hover:border-text-3'
                                        }`}
                                        placeholder="10"
                                    />
                                    <p className="text-[11px] text-text-3 mt-1">
                                        Alert when stock drops to this number.
                                    </p>
                                    {errors.lowStockThreshold && (
                                        <p className="text-xs text-danger mt-1">
                                            {errors.lowStockThreshold}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right column: Image + Tips */}
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="inline-flex items-center gap-2">
                                <ImageIcon size={14} />
                                Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="aspect-square w-full max-w-[220px] mx-auto rounded-md border border-border overflow-hidden bg-surface-2 flex items-center justify-center">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt="Product"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-text-3">
                                        <ImageIcon size={28} />
                                        <p className="text-[11px] uppercase tracking-widest">
                                            No image
                                        </p>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleImageSelected(file);
                                    e.target.value = '';
                                }}
                            />

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={imageUrl ? 'secondary' : 'primary'}
                                    size="sm"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={uploadingImage}
                                    className="flex-1"
                                >
                                    <Upload size={13} />
                                    {uploadingImage
                                        ? 'Uploading…'
                                        : imageUrl
                                          ? 'Replace'
                                          : 'Upload image'}
                                </Button>
                                {imageUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveImage}
                                        disabled={uploadingImage}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <p className="text-[11px] text-text-3">
                                JPG, PNG, WebP or GIF · up to 2 MB.
                                {!isEditMode && pendingImageFile && (
                                    <>
                                        {' '}
                                        Image will upload after the product is
                                        created.
                                    </>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Scanner</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-text-2 space-y-2">
                            <p className="flex items-start gap-2">
                                <Scan
                                    size={13}
                                    className="text-text-3 mt-0.5 flex-shrink-0"
                                />
                                Use a USB barcode scanner — it auto-fills the
                                barcode field.
                            </p>
                            <p className="flex items-start gap-2">
                                <Camera
                                    size={13}
                                    className="text-text-3 mt-0.5 flex-shrink-0"
                                />
                                Or click the camera icon next to the Barcode
                                input.
                            </p>
                            <p className="flex items-start gap-2">
                                <Package
                                    size={13}
                                    className="text-text-3 mt-0.5 flex-shrink-0"
                                />
                                If the barcode matches a product, fields
                                auto-fill on blur.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </form>

            <Modal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                title="Scan barcode"
                maxWidth="lg"
            >
                <UniversalScanner
                    onScanSuccess={(scannedBarcode) => {
                        lookupBarcode(scannedBarcode);
                        setShowCameraScanner(false);
                    }}
                />
            </Modal>
        </div>
    );
}
