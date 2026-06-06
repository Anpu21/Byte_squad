import type { IStockTransferRequest } from '@/types';

export function ShipmentLines({ lines }: { lines: IStockTransferRequest[] }) {
    return (
        <div className="border border-border rounded-xl bg-surface overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-1">Items</h3>
            </div>
            <table className="w-full text-sm">
                <tbody>
                    {lines.map((line) => (
                        <tr key={line.id} className="border-t border-border first:border-t-0">
                            <td className="px-5 py-2.5 text-text-1">
                                {line.product?.name ?? line.productId}
                            </td>
                            <td className="px-5 py-2.5 text-right tabular-nums text-text-2">
                                {line.approvedQuantity ?? line.requestedQuantity}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
