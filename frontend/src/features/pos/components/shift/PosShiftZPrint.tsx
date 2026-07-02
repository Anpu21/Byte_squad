import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '@/lib/utils';
import type { IPosShift } from '@/types';

interface IPosShiftZPrintProps {
    shift: IPosShift;
    onDone: () => void;
}

const row = (label: string, value: string) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
        }}
    >
        <span>{label}</span>
        <span>{value}</span>
    </div>
);

/**
 * Z-report print portal. Same mechanics as `PosPrintHost`: a direct
 * `<body>` child carrying `data-pos-print-area` so the thermal print
 * stylesheet isolates it, then `window.print()` on the next paint.
 */
export function PosShiftZPrint({ shift, onDone }: IPosShiftZPrintProps) {
    useEffect(() => {
        const handle = requestAnimationFrame(() => window.print());
        const after = () => onDone();
        window.addEventListener('afterprint', after);
        return () => {
            cancelAnimationFrame(handle);
            window.removeEventListener('afterprint', after);
        };
    }, [onDone]);

    const money = (n: number | null) => formatCurrency(Number(n ?? 0));

    return createPortal(
        <div
            data-pos-print-area
            aria-hidden
            style={{ position: 'absolute', left: -10000, top: 0 }}
        >
            <div
                style={{
                    width: '72mm',
                    padding: '4mm',
                    fontFamily: 'monospace',
                    color: '#000',
                }}
            >
                <h1 style={{ fontSize: 14, textAlign: 'center', margin: 0 }}>
                    Z-REPORT — SHIFT CLOSE
                </h1>
                <p style={{ fontSize: 11, textAlign: 'center', margin: '2mm 0' }}>
                    {shift.branch?.name ?? ''}
                    <br />
                    {new Date(shift.openedAt).toLocaleString()} →{' '}
                    {shift.closedAt
                        ? new Date(shift.closedAt).toLocaleString()
                        : ''}
                </p>
                <hr />
                {row('Sales count', String(shift.salesCount ?? 0))}
                {row('Sales total', money(shift.salesTotal))}
                {row('Refunds', money(shift.refundsTotal))}
                {row('Paid in', money(shift.totalPayIn))}
                {row('Paid out', money(shift.totalPayOut))}
                <hr />
                {row('Cash', money(shift.totalCash))}
                {row('Card', money(shift.totalElectronic))}
                {row('Cheque', money(shift.totalCheque))}
                {row('Bank', money(shift.totalBank))}
                {row('Customer credit', money(shift.totalCredit))}
                <hr />
                {row('Opening float', money(shift.openingFloat))}
                {row('Expected cash', money(shift.expectedCash))}
                {row('Counted cash', money(shift.countedCash))}
                {row('Over / short', money(shift.overShort))}
                {shift.notes ? (
                    <p style={{ fontSize: 11, marginTop: '2mm' }}>
                        Notes: {shift.notes}
                    </p>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}
