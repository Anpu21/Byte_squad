import Modal from '@/components/ui/Modal';
import UniversalScanner from '@/components/Scanner/UniversalScanner';
import { useProductFormPage } from '@/features/product-form/hooks/useProductFormPage';
import { ProductFormHeader } from '@/features/product-form/components/ProductFormHeader';
import { BasicsCard } from '@/features/product-form/components/BasicsCard';
import { PricingCard } from '@/features/product-form/components/PricingCard';
import { StockCard } from '@/features/product-form/components/StockCard';
import { ImageCard } from '@/features/product-form/components/ImageCard';
import { ScannerTipsCard } from '@/features/product-form/components/ScannerTipsCard';

export function ProductFormPage() {
    const p = useProductFormPage();
    const { form, image } = p;

    if (p.isLoadingProduct) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProductFormHeader
                isEditMode={p.isEditMode}
                isSubmitting={p.isSubmitting}
            />

            {form.errors.general && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {form.errors.general}
                </div>
            )}

            <form
                id="product-form"
                onSubmit={p.handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <BasicsCard
                        form={form}
                        categories={p.categories}
                        isEditMode={p.isEditMode}
                        onLookupBarcode={p.lookupBarcode}
                        onOpenCamera={() => p.setShowCameraScanner(true)}
                    />
                    <PricingCard form={form} derived={p.priceDerived} />
                    {!p.isEditMode && <StockCard form={form} />}
                </div>
                <div className="flex flex-col gap-4">
                    <ImageCard
                        imageUrl={image.imageUrl}
                        uploadingImage={image.uploadingImage}
                        fileInputRef={image.fileInputRef}
                        pendingImageFile={image.pendingImageFile}
                        isEditMode={p.isEditMode}
                        onImageSelected={image.handleImageSelected}
                        onRemove={image.handleRemoveImage}
                    />
                    <ScannerTipsCard />
                </div>
            </form>

            <Modal
                isOpen={p.showCameraScanner}
                onClose={() => p.setShowCameraScanner(false)}
                title="Scan barcode"
                maxWidth="lg"
            >
                <UniversalScanner
                    onScanSuccess={(scannedBarcode) => {
                        p.lookupBarcode(scannedBarcode);
                        p.setShowCameraScanner(false);
                    }}
                />
            </Modal>
        </div>
    );
}
