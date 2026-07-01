import type { FormEvent, RefObject } from 'react';
import { LuScanLine as ScanLine } from 'react-icons/lu';
import {
    Button,
    Card,
    CardContent,
    FIELD_SHELL,
    FIELD_BORDER,
} from '@/components/ui';

interface PosPickupToolbarProps {
    onScan: () => void;
    manualCode: string;
    setManualCode: (v: string) => void;
    onSubmit: (e: FormEvent) => void;
    looking: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Pickup action bar: a prominent "Scan QR" button plus an inline code lookup.
 * The status/search filters live in the queue table below, so this stays a
 * compact, always-visible collection launcher.
 */
export function PosPickupToolbar({
    onScan,
    manualCode,
    setManualCode,
    onSubmit,
    looking,
    inputRef,
}: PosPickupToolbarProps) {
    return (
        <Card>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={onScan}
                    className="sm:w-auto"
                >
                    <ScanLine size={16} aria-hidden />
                    Scan QR
                </Button>
                <div
                    className="hidden h-8 w-px bg-border sm:block"
                    aria-hidden
                />
                <form
                    onSubmit={onSubmit}
                    className="flex flex-1 items-center gap-2"
                >
                    <div className="relative flex-1">
                        <label htmlFor="pickup-code" className="sr-only">
                            Pickup order code
                        </label>
                        <input
                            id="pickup-code"
                            ref={inputRef}
                            value={manualCode}
                            onChange={(e) =>
                                setManualCode(e.target.value.toUpperCase())
                            }
                            placeholder="ORD-XXXXXXXX"
                            className={`${FIELD_SHELL} ${FIELD_BORDER} h-11 w-full px-3 font-mono`}
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="secondary"
                        size="lg"
                        disabled={looking}
                    >
                        {looking ? 'Looking up…' : 'Look up'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
