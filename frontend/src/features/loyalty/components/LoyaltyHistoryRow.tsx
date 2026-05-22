import { Link } from 'react-router-dom';
import { Edit3, Minus, RotateCcw, Sparkles } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import {
    LOYALTY_LEDGER_ENTRY_TYPE,
    type ILoyaltyHistoryEntry,
} from '@/types';

interface LoyaltyHistoryRowProps {
    entry: ILoyaltyHistoryEntry;
}

interface Style {
    icon: typeof Sparkles;
    label: string;
    glyph: string;
    tone: string;
}

function styleFor(entry: ILoyaltyHistoryEntry): Style {
    switch (entry.type) {
        case LOYALTY_LEDGER_ENTRY_TYPE.EARNED:
            return {
                icon: Sparkles,
                label: 'Earned',
                glyph: `+${entry.points}`,
                tone: 'text-success',
            };
        case LOYALTY_LEDGER_ENTRY_TYPE.REDEEMED:
            return {
                icon: Minus,
                label: 'Redeemed',
                glyph: `-${entry.points}`,
                tone: 'text-warning',
            };
        case LOYALTY_LEDGER_ENTRY_TYPE.REVERSED:
            return {
                icon: RotateCcw,
                label: 'Reversed',
                glyph: `+${entry.points}`,
                tone: 'text-text-2',
            };
        case LOYALTY_LEDGER_ENTRY_TYPE.ADJUSTED:
        default:
            return {
                icon: Edit3,
                label: 'Adjusted',
                glyph: `${entry.points >= 0 ? '+' : ''}${entry.points}`,
                tone: 'text-text-2',
            };
    }
}

function formatRelative(iso: string): string {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return new Date(iso).toLocaleDateString();
}

export function LoyaltyHistoryRow({ entry }: LoyaltyHistoryRowProps) {
    const style = styleFor(entry);
    const Icon = style.icon;

    return (
        <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-b-0">
            <div className="flex items-center gap-3 min-w-0">
                <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 ${style.tone}`}
                    aria-hidden="true"
                >
                    <Icon size={14} />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate">
                        {style.label}
                        {entry.orderCode ? (
                            <>
                                <span className="text-text-3"> &middot; </span>
                                <Link
                                    to={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                                        ':code',
                                        entry.orderCode,
                                    )}
                                    className="text-primary hover:opacity-80"
                                >
                                    {entry.orderCode}
                                </Link>
                            </>
                        ) : null}
                    </p>
                    <p className="text-xs text-text-3 truncate">
                        {formatRelative(entry.createdAt)}
                    </p>
                </div>
            </div>
            <p className={`text-sm font-semibold tabular-nums ${style.tone}`}>
                {style.glyph}
            </p>
        </div>
    );
}
