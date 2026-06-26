import {
    type KeyboardEvent as ReactKeyboardEvent,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuSearch as Search } from 'react-icons/lu';
import { type IconType } from 'react-icons';
import Modal from './Modal';
import { ICON } from './icon-sizes';
import { SIDEBAR, resolveNavPath } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

interface PaletteEntry {
    id: string;
    label: string;
    /** Parent section name, for sub-tab entries. */
    group?: string;
    Icon?: IconType;
    to: string;
}

/**
 * ⌘K "go to" palette. Searches the in-memory navigation config (sidebar sections
 * + their sub-tabs), role-filtered exactly like the sidebar, and navigates with
 * react-router. Frontend-only — no backend, no entity search. Built on the shared
 * {@link Modal} (focus-trap / ESC / scroll-lock / focus restore).
 */
export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();

    // Flatten the nav config into navigable destinations (sections + sub-tabs).
    const entries = useMemo<PaletteEntry[]>(() => {
        const out: PaletteEntry[] = [];
        for (const section of SIDEBAR) {
            if (!role || !section.roles.includes(role)) continue;
            const sectionPath = resolveNavPath(section, role);
            const sectionLabel = t(section.label);
            out.push({
                id: section.id,
                label: sectionLabel,
                Icon: section.Icon,
                to: sectionPath,
            });
            for (const tab of section.tabs ?? []) {
                if (tab.roles && !(role && tab.roles.includes(role))) continue;
                out.push({
                    id: `${section.id}:${tab.key}`,
                    label: (role && tab.labelByRole?.[role]) ?? tab.label,
                    group: sectionLabel,
                    Icon: (role && tab.iconByRole?.[role]) ?? tab.Icon ?? section.Icon,
                    to: `${sectionPath}?tab=${tab.key}`,
                });
            }
        }
        return out;
    }, [role, t]);

    const results = useMemo<PaletteEntry[]>(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(
            (e) =>
                e.label.toLowerCase().includes(q) ||
                (e.group?.toLowerCase().includes(q) ?? false),
        );
    }, [entries, query]);

    // Reset query/highlight when the palette opens — the idiomatic "reset state on
    // prop change" pattern (adjust during render, not in an effect).
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setQuery('');
            setActive(0);
        }
    }

    // Focus the input after Modal's own focus pass (child effects run first, so
    // this rAF lands after Modal's).
    useEffect(() => {
        if (!open) return;
        const id = requestAnimationFrame(() => inputRef.current?.focus());
        return () => cancelAnimationFrame(id);
    }, [open]);

    const select = (entry: PaletteEntry) => {
        onClose();
        navigate(entry.to);
    };

    const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const sel = results[active];
            if (sel) select(sel);
        }
    };

    const activeId = results[active] ? `${listId}-opt-${active}` : undefined;

    return (
        <Modal isOpen={open} onClose={onClose} title={t('shell.commandPalette')} maxWidth="lg">
            <div className="-m-1">
                <div className="flex items-center gap-2 px-2 pb-3 border-b border-border">
                    <Search size={ICON.md} className="text-text-3" aria-hidden />
                    <input
                        ref={inputRef}
                        type="text"
                        role="combobox"
                        aria-expanded
                        aria-controls={listId}
                        aria-activedescendant={activeId}
                        aria-autocomplete="list"
                        aria-label={t('shell.searchPlaceholder')}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder={t('shell.searchPlaceholder')}
                        className="flex-1 bg-transparent text-sm text-text-1 outline-none placeholder:text-text-3"
                    />
                </div>

                {results.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm text-text-3">
                        {t('shell.noResults')}
                    </p>
                ) : (
                    <ul
                        id={listId}
                        role="listbox"
                        aria-label={t('shell.commandPalette')}
                        className="max-h-[min(60vh,360px)] overflow-y-auto py-2"
                    >
                        {results.map((entry, i) => {
                            const Icon = entry.Icon;
                            const isActive = i === active;
                            return (
                                <li
                                    key={entry.id}
                                    id={`${listId}-opt-${i}`}
                                    role="option"
                                    aria-selected={isActive}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => select(entry)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
                                        isActive ? 'bg-surface-2' : 'hover:bg-surface-2',
                                    )}
                                >
                                    {Icon && (
                                        <Icon
                                            size={ICON.md}
                                            strokeWidth={2}
                                            className="flex-shrink-0 text-text-3"
                                            aria-hidden
                                        />
                                    )}
                                    <span className="flex-1 truncate text-sm text-text-1">
                                        {entry.label}
                                    </span>
                                    {entry.group && (
                                        <span className="text-xs text-text-3">
                                            {entry.group}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
