import type { ICreateManagerBatchTransferPayload } from '@/types';
import type { TransferRequestCartLine } from '../types/transfer-request-cart-line.type';

interface BuildPayloadArgs {
    requestReason: string;
    lines: TransferRequestCartLine[];
}

export function buildManagerBatchPayload({
    requestReason,
    lines,
}: BuildPayloadArgs): ICreateManagerBatchTransferPayload {
    return {
        requestReason: requestReason.trim(),
        lines: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
        })),
    };
}
