import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
    it('exposes the label as the accessible name (floating label)', () => {
        render(<Input label="Email address" />);
        expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    it('uses a space-sentinel placeholder when floating so :placeholder-shown drives the label', () => {
        render(<Input label="Email address" />);
        expect(screen.getByLabelText('Email address')).toHaveAttribute(
            'placeholder',
            ' ',
        );
    });

    it('keeps the real placeholder and renders no label when unlabeled', () => {
        render(<Input placeholder="Search products" aria-label="Search" />);
        expect(screen.getByPlaceholderText('Search products')).toBeInTheDocument();
        // "Search products" is the placeholder, not a <label> element.
        expect(screen.queryByText('Search products')).toBeNull();
    });

    it('marks the field invalid, shows the error, and shakes its wrapper', () => {
        render(<Input label="Email" error="Required" />);
        const field = screen.getByLabelText('Email');
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(field.parentElement).toHaveClass('field-error-shake');
    });
});
