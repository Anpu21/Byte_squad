import { Fragment } from 'react';
import { LuCheck as Check, LuBan as Ban } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import type { CustomerOrderStatus } from '@/types';
import { orderTimelineStep, TIMELINE_STEPS } from '../lib/order-timeline-step';
import { STATUS_LABEL } from '../lib/status-style';

interface OrderStatusTimelineProps {
    status: CustomerOrderStatus;
}

/**
 * Horizontal Placed → Ready → Picked up stepper. Negative outcomes render a
 * single terminal chip instead of the happy path. Derives everything from the
 * order status via {@link orderTimelineStep} — no backend timestamps needed.
 */
export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
    const { phase, step } = orderTimelineStep(status);

    if (phase === 'terminal') {
        return (
            <div className="flex items-center gap-2 text-[13px] font-medium text-text-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-text-3">
                    <Ban size={13} aria-hidden="true" />
                </span>
                {STATUS_LABEL[status]}
            </div>
        );
    }

    return (
        <div className="flex items-start" role="list" aria-label="Order progress">
            {TIMELINE_STEPS.map((label, i) => {
                const done = i < step;
                const current = i === step;
                return (
                    <Fragment key={label}>
                        {i > 0 && (
                            <div
                                className={cn(
                                    'mt-3 h-0.5 flex-1 rounded-full',
                                    i <= step ? 'bg-accent' : 'bg-border',
                                )}
                                aria-hidden="true"
                            />
                        )}
                        <div
                            role="listitem"
                            aria-current={current ? 'step' : undefined}
                            className="flex flex-col items-center gap-1.5"
                        >
                            <span
                                className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                                    done && 'bg-accent text-text-inv',
                                    current &&
                                        'bg-primary text-text-inv ring-4 ring-primary/15',
                                    !done &&
                                        !current &&
                                        'border border-border-strong bg-surface text-text-3',
                                )}
                            >
                                {done ? (
                                    <Check size={13} aria-hidden="true" />
                                ) : (
                                    i + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'whitespace-nowrap text-[11px] font-medium',
                                    current
                                        ? 'text-text-1'
                                        : done
                                          ? 'text-text-2'
                                          : 'text-text-3',
                                )}
                            >
                                {label}
                            </span>
                        </div>
                    </Fragment>
                );
            })}
        </div>
    );
}
