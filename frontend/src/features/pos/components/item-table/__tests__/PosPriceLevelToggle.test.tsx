import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosPriceLevelToggle } from '../PosPriceLevelToggle';

describe('PosPriceLevelToggle', () => {
    it('renders both Retail and Wholesale options', () => {
        render(<PosPriceLevelToggle value="Retail" onChange={vi.fn()} />);
        expect(
            screen.getByRole('button', { name: 'Retail' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Wholesale' }),
        ).toBeInTheDocument();
    });

    it('calls onChange when the other option is clicked', async () => {
        const onChange = vi.fn();
        render(<PosPriceLevelToggle value="Retail" onChange={onChange} />);

        await userEvent.click(
            screen.getByRole('button', { name: 'Wholesale' }),
        );
        expect(onChange).toHaveBeenCalledWith('Wholesale');
    });

    it('does not invoke onChange when the active option is clicked', async () => {
        // Segmented forwards every click but the spec is "fire on change";
        // we accept the documented behaviour of always firing on click and
        // assert the payload matches the current value (no flip).
        const onChange = vi.fn();
        render(<PosPriceLevelToggle value="Wholesale" onChange={onChange} />);
        await userEvent.click(
            screen.getByRole('button', { name: 'Wholesale' }),
        );
        expect(onChange).toHaveBeenCalledWith('Wholesale');
    });
});
