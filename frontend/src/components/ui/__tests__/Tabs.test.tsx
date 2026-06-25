import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LuWallet as Wallet } from 'react-icons/lu';
import { Tabs, type TabItem } from '../Tabs';

type Key = 'one' | 'two' | 'three';

const TABS: TabItem<Key>[] = [
    { key: 'one', label: 'One', Icon: Wallet },
    { key: 'two', label: 'Two' },
    { key: 'three', label: 'Three', badge: 4 },
];

describe('Tabs', () => {
    it('renders a tablist with one tab per item and marks the active one', () => {
        render(
            <Tabs tabs={TABS} active="two" onChange={() => {}} ariaLabel="Views" />,
        );
        expect(screen.getByRole('tablist', { name: 'Views' })).toBeInTheDocument();
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
        expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
            'aria-selected',
            'false',
        );
    });

    it('calls onChange with the tab key when a tab is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <Tabs tabs={TABS} active="one" onChange={onChange} ariaLabel="Views" />,
        );
        await user.click(screen.getByRole('tab', { name: 'Two' }));
        expect(onChange).toHaveBeenCalledWith('two');
    });

    it('renders an optional badge', () => {
        render(
            <Tabs tabs={TABS} active="one" onChange={() => {}} ariaLabel="Views" />,
        );
        expect(screen.getByText('4')).toBeInTheDocument();
    });
});
