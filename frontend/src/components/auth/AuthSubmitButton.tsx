import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Visual phase for the auth submit button — map from a mutation's state. */
export type AuthSubmitPhase = 'idle' | 'loading' | 'success';

interface AuthSubmitButtonProps {
    /** idle → loading (dots) → success (check + particle burst). */
    phase: AuthSubmitPhase;
    /** Resting label, e.g. "Sign in". */
    idleLabel: string;
    /** Flashed in the success state, e.g. "You're in". */
    successLabel?: string;
    /** Trailing icon shown in the idle state. */
    idleIcon?: ReactNode;
    /** Extra disable reason (e.g. a hard-blocked form); loading/success also disable. */
    disabled?: boolean;
    className?: string;
}

// Static 6-particle fan (mirrors the design's burst math) — px translate targets.
const BURST: ReadonlyArray<{ tx: number; ty: number }> = [
    { tx: -55.6, ty: -35.5 },
    { tx: -43.0, ty: -62.6 },
    { tx: -13.1, ty: -64.7 },
    { tx: 15.1, ty: -74.5 },
    { tx: 37.4, ty: -54.4 },
    { tx: 64.1, ty: -40.8 },
];

/**
 * Cream/indigo (token `--primary`) submit button with an internal state machine:
 * the label cross-fades to bouncing dots while pending, then to a check + "You're
 * in" with a one-shot particle burst on success (button turns `--accent`). The
 * page drives `phase` from its mutation; every animation is covered by the global
 * `prefers-reduced-motion` guard. Render inside a `<form>` — it's `type="submit"`.
 */
export default function AuthSubmitButton({
    phase,
    idleLabel,
    successLabel = "You're in",
    idleIcon,
    disabled,
    className,
}: AuthSubmitButtonProps) {
    const isLoading = phase === 'loading';
    const isSuccess = phase === 'success';

    return (
        <div className="relative">
            {/* Particle burst — only mounted on success so the one-shot keyframe fires. */}
            {isSuccess && (
                <div
                    className="pointer-events-none absolute inset-0 z-[3]"
                    aria-hidden="true"
                >
                    {BURST.map((p, i) => (
                        <span
                            key={i}
                            className="absolute left-1/2 top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={
                                {
                                    background:
                                        i % 2 ? 'var(--accent)' : 'var(--primary)',
                                    '--tx': `${p.tx}px`,
                                    '--ty': `${p.ty}px`,
                                    animation: `lp-burst .8s cubic-bezier(.2,.7,.3,1) ${i * 18}ms forwards`,
                                } as CSSProperties
                            }
                        />
                    ))}
                </div>
            )}

            <button
                type="submit"
                disabled={disabled || isLoading || isSuccess}
                aria-busy={isLoading}
                className={cn(
                    'relative grid h-14 w-full place-items-center overflow-hidden rounded-[14px] text-[15px] font-bold outline-none',
                    'transition-[background-color,color,transform] duration-300',
                    'hover:-translate-y-px active:translate-y-px active:scale-[0.992]',
                    'focus-visible:ring-[3px] focus-visible:ring-primary/30',
                    'disabled:cursor-default disabled:hover:translate-y-0',
                    isSuccess ? 'bg-accent text-text-inv' : 'bg-primary text-text-inv',
                    className,
                )}
            >
                {/* Sheen sweep. */}
                <span
                    className="pointer-events-none absolute left-0 top-0 h-full w-[38%]"
                    style={{
                        background:
                            'linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)',
                        animation: 'lp-sheen 6.5s ease-in-out 2.4s infinite',
                    }}
                    aria-hidden="true"
                />

                {/* Idle label (kept in DOM for a stable accessible name). */}
                <span
                    className={cn(
                        'relative inline-flex items-center gap-2 transition-all duration-200',
                        (isLoading || isSuccess) &&
                            'translate-y-[-4px] opacity-0',
                    )}
                >
                    {idleLabel}
                    {idleIcon}
                </span>

                {/* Loading dots. */}
                <span
                    className={cn(
                        'absolute inline-flex gap-1.5 transition-opacity duration-200',
                        isLoading ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                >
                    {[0, 0.15, 0.3].map((delay, i) => (
                        <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-current"
                            style={{
                                animation: `lp-dots 1.1s ease-in-out ${delay}s infinite`,
                            }}
                        />
                    ))}
                </span>

                {/* Success flash. */}
                <span
                    className={cn(
                        'absolute inline-flex items-center gap-2 font-bold transition-all duration-300',
                        isSuccess
                            ? 'scale-100 opacity-100'
                            : 'scale-50 opacity-0',
                    )}
                    aria-hidden="true"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m5 12.5 4.5 4.5L19 7" />
                    </svg>
                    {successLabel}
                </span>
            </button>
        </div>
    );
}
