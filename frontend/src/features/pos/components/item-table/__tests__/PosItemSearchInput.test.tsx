import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosItemSearchInput } from '../PosItemSearchInput';

describe('PosItemSearchInput', () => {
    it('renders with the supplied value and placeholder', () => {
        render(
            <PosItemSearchInput
                value=""
                onChange={vi.fn()}
                placeholder="Search rice"
            />,
        );
        expect(
            screen.getByPlaceholderText('Search rice'),
        ).toBeInTheDocument();
    });

    it('calls onChange on every keystroke (immediate)', async () => {
        const onChange = vi.fn();
        render(<PosItemSearchInput value="" onChange={onChange} />);
        const input = screen.getByRole('textbox', {
            name: 'Search products',
        });
        await userEvent.type(input, 'r');
        expect(onChange).toHaveBeenCalledWith('r');
    });

    it('fires onDebouncedChange after debounceMs', () => {
        vi.useFakeTimers();
        const onDebouncedChange = vi.fn();
        const { rerender } = render(
            <PosItemSearchInput
                value=""
                onChange={vi.fn()}
                onDebouncedChange={onDebouncedChange}
                debounceMs={300}
            />,
        );

        // Initial render emits the empty debounced value once.
        act(() => vi.advanceTimersByTime(300));
        expect(onDebouncedChange).toHaveBeenLastCalledWith('');

        rerender(
            <PosItemSearchInput
                value="rice"
                onChange={vi.fn()}
                onDebouncedChange={onDebouncedChange}
                debounceMs={300}
            />,
        );

        act(() => vi.advanceTimersByTime(299));
        // Still waiting — last debounced emission is still the empty string.
        expect(onDebouncedChange).toHaveBeenLastCalledWith('');

        act(() => vi.advanceTimersByTime(1));
        expect(onDebouncedChange).toHaveBeenLastCalledWith('rice');

        vi.useRealTimers();
    });
});
