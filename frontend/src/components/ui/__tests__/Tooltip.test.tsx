import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from '../Tooltip';

describe('Tooltip', () => {
    it('renders only its children when disabled (no bubble)', () => {
        render(
            <Tooltip label="Inventory" disabled>
                <button>Trigger</button>
            </Tooltip>,
        );
        expect(screen.getByText('Trigger')).toBeInTheDocument();
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows a decorative tooltip on hover after the delay', async () => {
        const user = userEvent.setup();
        render(
            <Tooltip label="Inventory" delay={0}>
                <button>Trigger</button>
            </Tooltip>,
        );
        await user.hover(screen.getByText('Trigger'));
        const tip = await screen.findByRole('tooltip', { hidden: true });
        expect(tip).toHaveTextContent('Inventory');
        expect(tip).toHaveAttribute('aria-hidden', 'true');
    });
});
