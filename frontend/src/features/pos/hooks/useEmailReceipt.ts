import { useMutation } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';

/**
 * Email the customer a PDF copy of a receipt. The PDF is rendered on the
 * client and forwarded to the backend, which attaches it and sends it via
 * the email service. Standalone (not tied to a query) — the bill modal
 * fires it and reports the result with a toast.
 */
export function useEmailReceipt() {
    return useMutation({
        mutationFn: (input: { saleId: string; pdfBase64: string }) =>
            posService.emailReceipt(input.saleId, input.pdfBase64),
    });
}
