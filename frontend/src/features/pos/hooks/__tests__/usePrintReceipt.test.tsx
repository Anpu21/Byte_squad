import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrintReceipt } from '../usePrintReceipt';
import { posService } from '@/services/pos.service';
import { makeWrapper } from './test-utils';
import { saleFixture } from './sale-fixture';

vi.mock('@/services/pos.service', () => ({
    posService: {
        markPrinted: vi.fn(),
    },
}));

const markPrintedMock = vi.mocked(posService.markPrinted);

describe('usePrintReceipt', () => {
    beforeEach(() => {
        markPrintedMock.mockReset();
        // jsdom does not implement window.print; spy on it so the hook's
        // synchronous call resolves without the catch-fallback firing.
        vi.spyOn(window, 'print').mockImplementation(() => undefined);
        // Drive RAF synchronously so the print scheduling completes inside
        // the act() that initiated it.
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
            (cb: FrameRequestCallback) => {
                cb(0);
                return 1;
            },
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('calls window.print and marks the sale printed after afterprint fires', async () => {
        markPrintedMock.mockResolvedValueOnce({
            ...saleFixture,
            billPrinted: true,
            billPrintCount: 1,
        });
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePrintReceipt(), {
            wrapper: Wrapper,
        });

        let printPromise: Promise<void>;
        act(() => {
            printPromise = result.current.printReceipt(saleFixture);
        });
        // afterprint is what the OS print dialog fires when it closes; emit
        // it manually so the hook completes its cleanup pass.
        act(() => {
            window.dispatchEvent(new Event('afterprint'));
        });
        await act(async () => {
            await printPromise;
        });

        expect(window.print).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(markPrintedMock).toHaveBeenCalledWith(saleFixture.id),
        );
        expect(result.current.printingSale).toBeNull();
    });

    it('still resolves and clears state when markPrinted rejects', async () => {
        markPrintedMock.mockRejectedValueOnce(new Error('network'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePrintReceipt(), {
            wrapper: Wrapper,
        });

        let printPromise: Promise<void>;
        act(() => {
            printPromise = result.current.printReceipt(saleFixture);
        });
        act(() => {
            window.dispatchEvent(new Event('afterprint'));
        });
        await act(async () => {
            await printPromise;
        });

        expect(markPrintedMock).toHaveBeenCalledWith(saleFixture.id);
        expect(result.current.printingSale).toBeNull();
    });

    it('falls back to a synthetic afterprint event when window.print throws', async () => {
        markPrintedMock.mockResolvedValueOnce(saleFixture);
        (window.print as ReturnType<typeof vi.spyOn>).mockImplementation(() => {
            throw new Error('no printer');
        });
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePrintReceipt(), {
            wrapper: Wrapper,
        });

        await act(async () => {
            await result.current.printReceipt(saleFixture);
        });

        await waitFor(() =>
            expect(markPrintedMock).toHaveBeenCalledWith(saleFixture.id),
        );
    });
});
