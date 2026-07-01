import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LuLock as Lock, LuLockOpen as LockOpen } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import { INPUT_CLASS, MONTH_NAMES } from '../financial-reports.lib';

export function PeriodLocksTab() {
    const queryClient = useQueryClient();
    const [lockYear, setLockYear] = useState(new Date().getFullYear());
    const [periodBusy, setPeriodBusy] = useState(false);
    const periodsQuery = useQuery({
        queryKey: queryKeys.ledger.periods(lockYear),
        queryFn: () => accountingService.listPeriodLocks(lockYear),
    });
    const lockedMonths = new Set((periodsQuery.data ?? []).map((p) => p.month));

    async function togglePeriod(month: number, locked: boolean) {
        if (periodBusy) return;
        setPeriodBusy(true);
        try {
            if (locked) {
                await accountingService.unlockPeriod(lockYear, month);
                toast.success(`${MONTH_NAMES[month - 1]} ${lockYear} unlocked`);
            } else {
                await accountingService.lockPeriod(lockYear, month);
                toast.success(
                    `${MONTH_NAMES[month - 1]} ${lockYear} locked — postings into it are now rejected`,
                );
            }
            void queryClient.invalidateQueries({
                queryKey: queryKeys.ledger.periods(lockYear),
            });
        } catch {
            toast.error('Could not update the period lock');
        } finally {
            setPeriodBusy(false);
        }
    }

    return (
        <Card className="p-5 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-wide text-text-3">
                    Year
                </label>
                <input
                    className={`${INPUT_CLASS} w-28 text-right`}
                    type="number"
                    min="2000"
                    max="2100"
                    value={lockYear}
                    onChange={(e) => setLockYear(Number(e.target.value))}
                    aria-label="Year"
                />
                <span className="text-xs text-text-3">
                    Locking a month rejects every posting whose business date
                    falls inside it — sales, purchases, expenses, and journals
                    alike.
                </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MONTH_NAMES.map((name, idx) => {
                    const month = idx + 1;
                    const locked = lockedMonths.has(month);
                    return (
                        <div
                            key={month}
                            className={`flex items-center justify-between p-3 rounded-md border ${
                                locked
                                    ? 'border-danger/40 bg-danger-soft/40'
                                    : 'border-border bg-surface'
                            }`}
                        >
                            <span className="text-[13px] text-text-1">
                                {name}
                            </span>
                            <Button
                                size="sm"
                                variant={locked ? 'secondary' : 'ghost'}
                                disabled={periodBusy}
                                onClick={() => void togglePeriod(month, locked)}
                            >
                                {locked ? (
                                    <>
                                        <LockOpen size={13} aria-hidden />
                                        Unlock
                                    </>
                                ) : (
                                    <>
                                        <Lock size={13} aria-hidden />
                                        Lock
                                    </>
                                )}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
