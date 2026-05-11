import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pill from './Pill';

describe('<Pill />', () => {
    it('renders children', () => {
        render(<Pill>Active</Pill>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies tone class', () => {
        render(<Pill tone="danger">Failed</Pill>);
        const pill = screen.getByText('Failed');
        expect(pill.className).toMatch(/text-danger/);
    });

    it('omits the dot when dot={false}', () => {
        render(<Pill dot={false}>Plain</Pill>);
        const pill = screen.getByText('Plain');
        expect(pill.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('renders the dot by default', () => {
        render(<Pill>WithDot</Pill>);
        const pill = screen.getByText('WithDot');
        expect(pill.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
});
