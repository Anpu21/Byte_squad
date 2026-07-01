import { type RefObject, useMemo } from 'react';
import { useInventoryByBranchQuery } from '@/hooks/useInventoryByBranchQuery';
import type { IProduct } from '@/types';
import type { TransferCartLine } from '../types/transfer-cart-line.type';
import { AdminTransferCartAddRow } from './AdminTransferCartAddRow';
import { AdminTransferCartRow } from './AdminTransferCartRow';

const INVENTORY_LIMIT = 500;

interface AdminTransferCartTableProps {
    sourceBranchId: string;
    destinationBranchId: string;
    lines: TransferCartLine[];
    totalUnits: number;
    onUpdateQuantity: (productId: string, qty: number) => void;
    onRemove: (productId: string) => void;
    onSelectProduct: (product: IProduct) => void;
    onOpenCamera: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

export function AdminTransferCartTable({
    sourceBranchId,
    destinationBranchId,
    lines,
    totalUnits,
    onUpdateQuantity,
    onRemove,
    onSelectProduct,
    onOpenCamera,
    inputRef,
}: AdminTransferCartTableProps) {
    const sourceInventoryQuery = useInventoryByBranchQuery(
        sourceBranchId || undefined,
        { limit: INVENTORY_LIMIT },
        { enabled: Boolean(sourceBranchId) },
    );
    const destinationInventoryQuery = useInventoryByBranchQuery(
        destinationBranchId || undefined,
        { limit: INVENTORY_LIMIT },
        { enabled: Boolean(destinationBranchId) },
    );

    const sourceQtyByProduct = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of sourceInventoryQuery.data?.items ?? []) {
            map.set(row.productId, row.quantity);
        }
        return map;
    }, [sourceInventoryQuery.data]);

    const destQtyByProduct = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of destinationInventoryQuery.data?.items ?? []) {
            map.set(row.productId, row.quantity);
        }
        return map;
    }, [destinationInventoryQuery.data]);

    return (
        <div className="flex-1 min-h-[240px] overflow-y-auto overflow-x-visible">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface z-[1]">
                    <tr className="text-[10px] uppercase tracking-[0.1em] text-text-3 border-b border-border">
                        <th className="px-3 py-2.5 font-semibold w-[40px] text-center">
                            #
                        </th>
                        <th className="px-3 py-2.5 font-semibold">Product</th>
                        <th className="px-2 py-2.5 font-semibold text-right w-[110px]">
                            Source qty
                        </th>
                        <th className="px-2 py-2.5 font-semibold text-center w-[140px]">
                            Transfer qty
                        </th>
                        <th className="px-2 py-2.5 font-semibold text-right w-[110px]">
                            Dest qty
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-right w-[140px]">
                            After transfer
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {lines.map((line, idx) => (
                        <AdminTransferCartRow
                            key={line.product.id}
                            line={line}
                            index={idx}
                            sourceQty={
                                sourceQtyByProduct.get(line.product.id) ?? null
                            }
                            destQty={
                                destQtyByProduct.get(line.product.id) ?? null
                            }
                            onUpdateQuantity={onUpdateQuantity}
                            onRemove={onRemove}
                        />
                    ))}

                    <AdminTransferCartAddRow
                        sourceBranchId={sourceBranchId}
                        onSelectProduct={onSelectProduct}
                        onOpenCamera={onOpenCamera}
                        inputRef={inputRef}
                    />
                </tbody>

                <tfoot>
                    <tr className="border-t-2 border-border-strong bg-surface-2/30">
                        <td colSpan={3} className="px-4 py-2.5 text-right">
                            <span className="text-[11px] uppercase tracking-[0.1em] text-text-2 font-semibold">
                                Total units to transfer
                            </span>
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums">
                            <span className="text-xl font-bold text-text-1 tracking-tight leading-none mono">
                                {totalUnits}
                            </span>
                        </td>
                        <td colSpan={2} />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
