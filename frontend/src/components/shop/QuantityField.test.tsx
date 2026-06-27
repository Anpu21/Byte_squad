import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuantityField } from './QuantityField';

function Harness({ dynamicStep = true }: { dynamicStep?: boolean }) {
    const [value, setValue] = useState(1);
    return (
        <QuantityField
            value={value}
            onChange={setValue}
            step={0.25}
            min={0}
            decimals={3}
            unitLabel="kg"
            dynamicStep={dynamicStep}
            ariaLabel="Quantity"
        />
    );
}

describe('QuantityField', () => {
    it('with dynamicStep: the typed value becomes the +/- step and − floors at 0', () => {
        render(<Harness />);
        const input = screen.getByRole('textbox', {
            name: 'Quantity',
        }) as HTMLInputElement;
        const dec = screen.getByRole('button', {
            name: 'Decrease quantity',
        }) as HTMLButtonElement;
        const inc = screen.getByRole('button', { name: 'Increase quantity' });

        // Type 0.5 → it becomes the step.
        fireEvent.change(input, { target: { value: '0.5' } });
        expect(input.value).toBe('0.5');

        fireEvent.click(inc); // 0.5 + 0.5
        expect(input.value).toBe('1');

        fireEvent.click(dec); // 1 - 0.5
        expect(input.value).toBe('0.5');

        fireEvent.click(dec); // 0.5 - 0.5, floored at 0
        expect(input.value).toBe('0');

        // Never goes negative — at 0 the − button is disabled.
        expect(dec.disabled).toBe(true);
    });

    it('without dynamicStep: +/- keep the fixed step regardless of typing', () => {
        render(<Harness dynamicStep={false} />);
        const input = screen.getByRole('textbox', {
            name: 'Quantity',
        }) as HTMLInputElement;

        fireEvent.change(input, { target: { value: '0.5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
        expect(input.value).toBe('0.75'); // 0.5 + fixed 0.25
    });
});
