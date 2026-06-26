import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    /** Tooltip text. The trigger must carry its own accessible name. */
    label: string;
    children: ReactNode;
    /** Skip the tooltip entirely (e.g. when the label is already visible). */
    disabled?: boolean;
    /** Open delay in ms. */
    delay?: number;
}

/**
 * A lightweight, keyboard-aware visual tooltip rendered in a portal so it escapes
 * the sidebar's overflow clipping. Shows to the right of the trigger on hover and
 * focus after a short delay; hides on leave, blur, or Escape. The bubble is
 * decorative (`aria-hidden`) — the trigger provides its own accessible name (the
 * collapsed nav links keep their `aria-label`), so screen readers aren't told the
 * label twice.
 */
export default function Tooltip({
    label,
    children,
    disabled = false,
    delay = 400,
}: TooltipProps) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const wrapRef = useRef<HTMLSpanElement>(null);
    const timer = useRef<number | undefined>(undefined);

    const show = () => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            const el = wrapRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setPos({ top: r.top + r.height / 2, left: r.right + 8 });
            setOpen(true);
        }, delay);
    };
    const hide = () => {
        window.clearTimeout(timer.current);
        setOpen(false);
    };

    useEffect(() => () => window.clearTimeout(timer.current), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') hide();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (disabled) return <>{children}</>;

    return (
        <span
            ref={wrapRef}
            className="block"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {open &&
                createPortal(
                    <div
                        role="tooltip"
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            top: pos.top,
                            left: pos.left,
                            transform: 'translateY(-50%)',
                        }}
                        className="z-toast pointer-events-none whitespace-nowrap rounded-md bg-text-1 px-2 py-1 text-xs font-medium text-canvas shadow-md-token animate-in fade-in duration-100"
                    >
                        {label}
                    </div>,
                    document.body,
                )}
        </span>
    );
}
