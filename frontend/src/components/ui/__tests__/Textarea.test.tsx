import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Textarea from '../Textarea';

describe('Textarea', () => {
    it('exposes the label as the accessible name', () => {
        render(<Textarea label="Notes" />);
        expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });

    it('floats via a space-sentinel placeholder when labeled', () => {
        render(<Textarea label="Notes" />);
        expect(screen.getByLabelText('Notes')).toHaveAttribute(
            'placeholder',
            ' ',
        );
    });

    it('shows the error text and marks the field invalid', () => {
        render(<Textarea label="Notes" error="Too long" />);
        const field = screen.getByLabelText('Notes');
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Too long')).toBeInTheDocument();
    });
});
