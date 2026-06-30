import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspacePage } from '../WorkspacePage';
import type { TabItem } from '../Tabs';

type Key = 'a' | 'b';
const TABS: TabItem<Key>[] = [
    { key: 'a', label: 'Alpha' },
    { key: 'b', label: 'Beta' },
];

describe('WorkspacePage', () => {
    it('renders the header, a tablist, and the active content', () => {
        render(
            <WorkspacePage
                title="My workspace"
                subtitle="Does things"
                tabs={TABS}
                active="a"
                onTabChange={() => {}}
                tabsAriaLabel="Workspace views"
            >
                <div>Alpha content</div>
            </WorkspacePage>,
        );
        expect(
            screen.getByRole('heading', { name: 'My workspace' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('tablist', { name: 'Workspace views' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Alpha content')).toBeInTheDocument();
    });

    it('forwards tab clicks to onTabChange', async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();
        render(
            <WorkspacePage
                title="My workspace"
                tabs={TABS}
                active="a"
                onTabChange={onTabChange}
                tabsAriaLabel="Workspace views"
            >
                <div>content</div>
            </WorkspacePage>,
        );
        await user.click(screen.getByRole('tab', { name: 'Beta' }));
        expect(onTabChange).toHaveBeenCalledWith('b');
    });

    it('omits the page header when embedded', () => {
        render(
            <WorkspacePage
                title="Hidden title"
                tabs={TABS}
                active="a"
                onTabChange={() => {}}
                tabsAriaLabel="Workspace views"
                embedded
            >
                <div>content</div>
            </WorkspacePage>,
        );
        expect(
            screen.queryByRole('heading', { name: 'Hidden title' }),
        ).not.toBeInTheDocument();
        // tablist still renders when embedded
        expect(
            screen.getByRole('tablist', { name: 'Workspace views' }),
        ).toBeInTheDocument();
    });

    it('keeps the header + content but drops the tab band when chromeless', () => {
        render(
            <WorkspacePage
                title="My workspace"
                tabs={TABS}
                active="a"
                onTabChange={() => {}}
                tabsAriaLabel="Workspace views"
                chromeless
            >
                <div>Alpha content</div>
            </WorkspacePage>,
        );
        expect(
            screen.getByRole('heading', { name: 'My workspace' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Alpha content')).toBeInTheDocument();
        // the in-page tab band is gone — the sub-tabs live in the sidebar panel now
        expect(
            screen.queryByRole('tablist', { name: 'Workspace views' }),
        ).not.toBeInTheDocument();
    });
});
