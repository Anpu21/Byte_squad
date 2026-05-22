import Segmented from '@/components/ui/Segmented';
import { formatDateRangeLabel } from '../lib/format';
import { PERIOD_OPTIONS, type PeriodKey } from '../lib/period';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border-strong text-text-1 text-sm rounded-md outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

interface ProfitLossHeaderProps {
    startDate: string;
    endDate: string;
    period: PeriodKey;
    onPeriodChange: (period: PeriodKey) => void;
    onStartChange: (v: string) => void;
    onEndChange: (v: string) => void;
}

export function ProfitLossHeader({
    startDate,
    endDate,
    period,
    onPeriodChange,
    onStartChange,
    onEndChange,
}: ProfitLossHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Profit &amp; Loss
                </h1>
                <p className="text-xs text-text-2 mt-1">
                    {formatDateRangeLabel(startDate, endDate)}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Segmented
                    value={period === 'custom' ? 'month' : period}
                    options={PERIOD_OPTIONS}
                    onChange={onPeriodChange}
                />
                <label htmlFor="pl-start" className="sr-only">
                    Start date
                </label>
                <input
                    id="pl-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartChange(e.target.value)}
                    className={INPUT_CLASS}
                />
                <span className="text-text-3 text-sm">to</span>
                <label htmlFor="pl-end" className="sr-only">
                    End date
                </label>
                <input
                    id="pl-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndChange(e.target.value)}
                    className={INPUT_CLASS}
                />
            </div>
        </div>
    );
}
