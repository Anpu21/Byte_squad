import { LuCamera as Camera } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import Pill from '@/components/ui/Pill';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { FormField } from './FormField';
import type { ProductFormState } from '../hooks/useProductFormState';
import { BARCODE_MIN_LOOKUP_LENGTH } from '../lib/constants';

interface BarcodeInputProps {
    form: ProductFormState;
    isEditMode: boolean;
    onLookup: (barcode: string) => void;
    onOpenCamera: () => void;
}

export function BarcodeInput({
    form,
    isEditMode,
    onLookup,
    onOpenCamera,
}: BarcodeInputProps) {
    const error = form.errors.barcode;
    const statusGood =
        form.barcodeStatus === 'found' || form.scanDetected;
    const borderClass = error
        ? 'border-danger'
        : statusGood
          ? 'border-accent'
          : FIELD_BORDER;

    return (
        <FormField label="Barcode / SKU" error={error}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        name="barcode"
                        value={form.barcode}
                        onChange={(e) => form.setBarcode(e.target.value)}
                        aria-invalid={Boolean(error)}
                        onBlur={() => {
                            if (form.barcode.trim().length >= BARCODE_MIN_LOOKUP_LENGTH && !isEditMode) {
                                onLookup(form.barcode.trim());
                            }
                        }}
                        className={cn(
                            FIELD_SHELL,
                            'w-full h-[38px] px-3 mono',
                            borderClass,
                        )}
                        placeholder="Scan or type barcode"
                    />
                </div>
                <button
                    type="button"
                    onClick={onOpenCamera}
                    className="h-[38px] w-[38px] flex items-center justify-center rounded-md border border-border-strong text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors"
                    title="Scan with camera"
                    aria-label="Scan with camera"
                >
                    <Camera size={16} />
                </button>
            </div>
            {(form.barcodeStatus !== 'idle' || form.scanDetected) && (
                <div className="mt-1.5">
                    {form.barcodeStatus === 'looking' && (
                        <Pill tone="warning">Looking up…</Pill>
                    )}
                    {form.barcodeStatus === 'found' && (
                        <Pill tone="success">Product details auto-filled</Pill>
                    )}
                    {form.barcodeStatus === 'new' && (
                        <Pill tone="info">New product</Pill>
                    )}
                    {form.scanDetected && form.barcodeStatus === 'idle' && (
                        <Pill tone="success">Scanned</Pill>
                    )}
                </div>
            )}
        </FormField>
    );
}
