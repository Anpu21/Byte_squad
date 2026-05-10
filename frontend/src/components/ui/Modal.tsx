import {
    type ReactNode,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    /**
     * Optional accessible description for the dialog body. Wired to
     * aria-describedby; pass when the body has a single descriptive paragraph.
     */
    describedBy?: string;
    /**
     * If false, clicking the backdrop will not close the modal — useful for
     * destructive flows where accidental dismissal is costly.
     */
    closeOnBackdrop?: boolean;
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'lg',
    describedBy,
    closeOnBackdrop = true,
}: ModalProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const previousActiveRef = useRef<HTMLElement | null>(null);

    // Defer unmount so the close animation can play before the node disappears.
    // Mirrors the 200ms duration on the panel/backdrop animation classes.
    const [mounted, setMounted] = useState(isOpen);
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            return;
        }
        if (!mounted) return;
        const t = setTimeout(() => setMounted(false), 200);
        return () => clearTimeout(t);
    }, [isOpen, mounted]);

    // Body scroll lock + ESC handler + focus trap, all gated on isOpen
    // (not `mounted`, so the trap releases as soon as close starts).
    useEffect(() => {
        if (!isOpen) return;

        previousActiveRef.current = document.activeElement as HTMLElement | null;

        // Initial focus: first focusable child, falling back to the panel itself.
        // Defer one frame so any conditional content has rendered.
        const focusFrame = requestAnimationFrame(() => {
            const panel = panelRef.current;
            if (!panel) return;
            const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            (first ?? panel).focus();
        });

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !panelRef.current) return;
            const focusables = Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            ).filter((el) => !el.hasAttribute('aria-hidden'));
            if (focusables.length === 0) {
                e.preventDefault();
                panelRef.current.focus();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            // Restore focus to the trigger so keyboard users land where they left off.
            const previous = previousActiveRef.current;
            if (previous && document.contains(previous)) {
                previous.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return (
        <div
            className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={describedBy}
        >
            <div
                className={`absolute inset-0 backdrop-blur-sm duration-200 ${
                    isOpen ? 'animate-in fade-in' : 'animate-out fade-out'
                }`}
                style={{ background: 'var(--overlay)' }}
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                tabIndex={-1}
                className={`relative w-full ${maxWidthMap[maxWidth]} bg-surface border border-border shadow-lg-token rounded-lg flex flex-col max-h-[90vh] outline-none duration-200 ${
                    isOpen
                        ? 'animate-in fade-in zoom-in-[0.98]'
                        : 'animate-out fade-out zoom-out-[0.98]'
                }`}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2
                        id={titleId}
                        className="text-base font-semibold text-text-1 tracking-tight"
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-1.5 -mr-1.5 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                        aria-label="Close modal"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
