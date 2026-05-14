import { type RefObject } from 'react';
import { Send } from 'lucide-react';
import type { IBranch, IProduct } from '@/types';
import type { TransferCartLine } from '../types/transfer-cart-line.type';
import { AdminTransferCartTable } from './AdminTransferCartTable';

interface AdminTransferCartPanelProps {
    sourceBranchId: string;
    destinationBranchId: string;
    sourceBranch: IBranch | null;
    destinationBranch: IBranch | null;
    lines: TransferCartLine[];
    totalUnits: number;
    onUpdateQuantity: (productId: string, qty: number) => void;
    onRemove: (productId: string) => void;
    onSelectProduct: (product: IProduct) => void;
    onOpenCamera: () => void;
    onSubmit: () => void;
    canSubmit: boolean;
    isSubmitting: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
}

export function AdminTransferCartPanel({
    sourceBranchId,
    destinationBranchId,
    sourceBranch,
    destinationBranch,
    lines,
    totalUnits,
    onUpdateQuantity,
    onRemove,
    onSelectProduct,
    onOpenCamera,
    onSubmit,
    canSubmit,
    isSubmitting,
    inputRef,
}: AdminTransferCartPanelProps) {
    const isEmpty = lines.length === 0;
    const routeLabel =
        sourceBranch && destinationBranch
            ? `${sourceBranch.name} → ${destinationBranch.name}`
            : 'Pick a source and destination branch';

    return (
        <div className="flex-1 min-h-0 min-w-0 bg-surface border border-border rounded-md shadow-md-token flex flex-col">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-semibold">
                        Stock Transfer
                    </p>
                    <h2 className="text-base font-bold text-text-1 tracking-tight mt-0.5">
                        {routeLabel}
                    </h2>
                </div>
                {lines.length > 0 && (
                    <span className="text-[11px] font-semibold bg-primary-soft text-primary-soft-text rounded-full px-2 py-0.5 tabular-nums">
                        {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                    </span>
                )}
            </div>

            <AdminTransferCartTable
                sourceBranchId={sourceBranchId}
                destinationBranchId={destinationBranchId}
                lines={lines}
                totalUnits={totalUnits}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                onSelectProduct={onSelectProduct}
                onOpenCamera={onOpenCamera}
                inputRef={inputRef}
            />

            <div className="p-3 border-t border-border bg-surface">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || isEmpty}
                    className="w-full h-12 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                >
                    <Send size={15} strokeWidth={2.5} />
                    <span>
                        {isSubmitting
                            ? 'Creating…'
                            : isEmpty
                              ? 'Add a product to begin'
                              : `Create ${lines.length} transfer${lines.length === 1 ? '' : 's'}`}
                    </span>
                    {!isEmpty && !isSubmitting && (
                        <span className="tabular-nums mono opacity-90">
                            · {totalUnits} unit{totalUnits === 1 ? '' : 's'}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
