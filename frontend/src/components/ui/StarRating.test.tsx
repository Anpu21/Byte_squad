import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StarRating } from './StarRating';

describe('StarRating', () => {
    it('exposes an accessible label with value and count (read-only)', () => {
        render(<StarRating value={4.5} count={12} />);
        expect(
            screen.getByRole('img', { name: /4\.5 out of 5 stars, 12 reviews/i }),
        ).toBeTruthy();
    });

    it('calls onChange with the picked star (interactive)', () => {
        const onChange = vi.fn();
        render(<StarRating value={0} readOnly={false} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('renders one star button per level in interactive mode', () => {
        render(<StarRating value={3} readOnly={false} onChange={vi.fn()} />);
        expect(screen.getAllByRole('radio')).toHaveLength(5);
    });
});
