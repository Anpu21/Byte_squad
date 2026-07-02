import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Modal from '../Modal';

function flushRaf() {
    return act(
        () =>
            new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve());
            }),
    );
}

/**
 * Re-renders on demand and passes a FRESH onClose identity every render —
 * the exact condition (an unstable parent callback) that used to make the
 * focus trap re-run and steal focus on each keystroke.
 */
function Harness() {
    const [, setTick] = useState(0);
    return (
        <div>
            <button type="button" onClick={() => setTick((t) => t + 1)}>
                rerender
            </button>
            <Modal isOpen onClose={() => {}} title="Test">
                <input aria-label="reason" />
            </Modal>
        </div>
    );
}

describe('Modal', () => {
    it('keeps focus on a field when the parent re-renders (unstable onClose)', async () => {
        render(<Harness />);
        await flushRaf(); // initial open focuses the first focusable

        const field = screen.getByLabelText('reason');
        act(() => field.focus());
        expect(field).toHaveFocus();

        // A keystroke in a real form re-renders the parent (new onClose id).
        act(() => fireEvent.click(screen.getByText('rerender')));
        await flushRaf();

        // Focus must not have jumped back to the first focusable element.
        expect(field).toHaveFocus();
    });
});
