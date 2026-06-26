import { LuCalendar as Calendar, LuChevronDown as ChevronDown } from 'react-icons/lu';

/**
 * Cosmetic date-range chip (v1). The dashboard window is fixed to the last 7
 * days server-side, so this is intentionally non-interactive — a real range
 * picker is deferred (it needs range params on every aggregation). Rendered as
 * a decorative element (not a button) so it isn't focusable or implies action.
 */
export function DateRangeButton() {
    return (
        <div
            aria-hidden
            className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-text-2 text-[13px] font-medium select-none"
        >
            <Calendar size={14} className="text-text-3" />
            Last 7 days
            <ChevronDown size={12} className="text-text-3" />
        </div>
    );
}
