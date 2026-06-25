import { LuCheck as Check, LuClock as Clock } from 'react-icons/lu';
import { TransferStatus } from '@/constants/enums';
import type { IStockTransferRequest } from '@/types';

interface AuditTimelineProps {
    transfer: IStockTransferRequest;
}

interface TimelineStep {
    label: string;
    user: { firstName: string; lastName: string } | null | undefined;
    timestamp: string | null | undefined;
    done: boolean;
}

function formatStamp(ts?: string | null): string {
    if (!ts) return 'Pending';
    return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Connected vertical audit timeline: request → review → ship → receive. Each
 * completed step is filled; pending steps are muted. Replaces the old 2×2 card
 * grid so the lifecycle reads top-to-bottom at a glance.
 */
export function AuditTimeline({ transfer }: AuditTimelineProps) {
    const reviewLabel =
        transfer.status === TransferStatus.REJECTED
            ? 'Rejected'
            : transfer.status === TransferStatus.CANCELLED
              ? 'Cancelled'
              : 'Reviewed';

    const steps: TimelineStep[] = [
        {
            label: 'Requested',
            user: transfer.requestedBy,
            timestamp: transfer.createdAt,
            done: true,
        },
        {
            label: reviewLabel,
            user: transfer.reviewedBy,
            timestamp: transfer.reviewedAt,
            done: Boolean(transfer.reviewedAt),
        },
        {
            label: 'Shipped',
            user: transfer.shippedBy,
            timestamp: transfer.shippedAt,
            done: Boolean(transfer.shippedAt),
        },
        {
            label: 'Received',
            user: transfer.receivedBy,
            timestamp: transfer.receivedAt,
            done: Boolean(transfer.receivedAt),
        },
    ];

    return (
        <div className="border border-border rounded-xl bg-surface p-5 mb-4">
            <h3 className="text-sm font-semibold text-text-1 mb-4">Timeline</h3>
            <ol className="relative">
                {steps.map((step, i) => (
                    <li
                        key={step.label}
                        className="relative flex gap-3 pb-5 last:pb-0"
                    >
                        {i < steps.length - 1 && (
                            <span
                                className={`absolute left-[11px] top-6 bottom-0 w-px ${
                                    step.done ? 'bg-primary/40' : 'bg-border'
                                }`}
                                aria-hidden="true"
                            />
                        )}
                        <span
                            className={`relative z-10 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.done
                                    ? 'bg-primary text-text-inv'
                                    : 'bg-surface-2 text-text-3 border border-border'
                            }`}
                        >
                            {step.done ? <Check size={13} /> : <Clock size={12} />}
                        </span>
                        <div className="min-w-0">
                            <p
                                className={`text-[13px] font-medium ${
                                    step.done ? 'text-text-1' : 'text-text-3'
                                }`}
                            >
                                {step.label}
                                {step.user
                                    ? ` · ${step.user.firstName} ${step.user.lastName}`
                                    : ''}
                            </p>
                            <p className="text-xs text-text-3 mt-0.5">
                                {formatStamp(step.timestamp)}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
