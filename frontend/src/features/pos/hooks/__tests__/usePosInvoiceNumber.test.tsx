import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosInvoiceNumber } from '../usePosInvoiceNumber';
import { posService } from '@/services/pos.service';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        previewInvoiceNumber: vi.fn(),
    },
}));

const previewMock = vi.mocked(posService.previewInvoiceNumber);

describe('usePosInvoiceNumber', () => {
    beforeEach(() => {
        previewMock.mockReset();
    });

    it('returns the next invoice number on success', async () => {
        previewMock.mockResolvedValueOnce({ invoiceNo: 'INV-0007' });
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosInvoiceNumber(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual({ invoiceNo: 'INV-0007' });
        expect(previewMock).toHaveBeenCalledTimes(1);
    });

    it('surfaces an error when the preview fails', async () => {
        previewMock.mockRejectedValueOnce(new Error('preview-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosInvoiceNumber(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('preview-fail');
    });
});
