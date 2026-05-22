import { type RefObject } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import type { IProduct } from '@/types';
import type { TransferRequestCartLine } from '../types/transfer-request-cart-line.type';
import { TransferRequestCartTable } from './TransferRequestCartTable';
import { TransferRequestReasonField } from './TransferRequestReasonField';

interface TransferRequestCartPanelProps {
    lines: TransferRequestCartLine[];
    totalUnits: number;
    onUpdateQuantity: (productId: string, qty: number) => void;
    onRemove: (productId: string) => void;
    onSelectProduct: (product: IProduct) => void;
    reason: string;
    onReasonChange: (value: string) => void;
    hasReason: boolean;
    onSubmit: () => void;
    canSubmit: boolean;
    isSubmitting: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onBack: () => void;
}

export function TransferRequestCartPanel({
    lines,
    totalUnits,
    onUpdateQuantity,
    onRemove,
    onSelectProduct,
    reason,
    onReasonChange,
    hasReason,
    onSubmit,
    canSubmit,
    isSubmitting,
    inputRef,
    onBack,
}: TransferRequestCartPanelProps) {
    const isEmpty = lines.length === 0;
    const buttonLabel = isSubmitting
        ? 'Submitting…'
        : isEmpty
          ? 'Add a product to begin'
          : !hasReason
            ? 'Add a reason to submit'
            : `Submit ${lines.length} request${lines.length === 1 ? '' : 's'}`;

    return (
        <div className="flex-1 min-h-0 min-w-0 bg-surface border border-border rounded-md shadow-md-token flex flex-col">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back to transfers"
                        className="p-1.5 -ml-1.5 rounded text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/30"
                    >
                        <ArrowLeft size={16} strokeWidth={2.25} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-semibold">
                            New transfer request
                        </p>
                        <h2 className="text-base font-bold text-text-1 tracking-tight mt-0.5 truncate">
                            Request stock from another branch
                        </h2>
                    </div>
                </div>
                {lines.length > 0 && (
                    <span className="text-[11px] font-semibold bg-primary-soft text-primary-soft-text rounded-full px-2 py-0.5 tabular-nums flex-shrink-0">
                        {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                    </span>
                )}
            </div>

            <TransferRequestCartTable
                lines={lines}
                totalUnits={totalUnits}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                onSelectProduct={onSelectProduct}
                inputRef={inputRef}
            />

            <TransferRequestReasonField
                value={reason}
                onChange={onReasonChange}
            />

            <div className="p-3 border-t border-border bg-surface">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || isEmpty}
                    className="w-full h-12 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                >
                    <Send size={15} strokeWidth={2.5} />
                    <span>{buttonLabel}</span>
                    {!isEmpty && hasReason && !isSubmitting && (
                        <span className="tabular-nums mono opacity-90">
                            · {totalUnits} unit{totalUnits === 1 ? '' : 's'}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
