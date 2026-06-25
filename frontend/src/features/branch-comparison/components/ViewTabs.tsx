import type { ComparisonView } from "../lib/format";
import { VIEW_OPTIONS } from "../lib/chart-config";

export function ViewTabs({
  value,
  onChange,
}: {
  value: ComparisonView;
  onChange: (view: ComparisonView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Branch comparison views"
      className="mb-4 flex gap-1 overflow-x-auto rounded-md border border-border bg-surface-2 p-1"
    >
      {VIEW_OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(optionValue)}
            className={`inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
              active
                ? "bg-surface text-text-1 shadow-xs"
                : "text-text-2 hover:bg-surface hover:text-text-1"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
