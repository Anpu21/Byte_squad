import type { ICreateAdminDirectTransferPayload } from '@/types';
import type { TransferCartLine } from '../types/transfer-cart-line.type';

interface BuildPayloadArgs {
    sourceBranchId: string;
    destinationBranchId: string;
    approvalNote?: string;
    lines: TransferCartLine[];
}

export function buildAdminDirectPayload({
    sourceBranchId,
    destinationBranchId,
    approvalNote,
    lines,
}: BuildPayloadArgs): ICreateAdminDirectTransferPayload {
    return {
        sourceBranchId,
        destinationBranchId,
        approvalNote: approvalNote?.trim() || undefined,
        lines: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
        })),
    };
}
