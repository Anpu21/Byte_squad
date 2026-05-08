import { type ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'lg',
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = previous;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="absolute inset-0 backdrop-blur-sm animate-in fade-in duration-200"
                style={{ background: 'var(--overlay)' }}
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={`relative w-full ${maxWidthMap[maxWidth]} bg-surface border border-border shadow-lg-token rounded-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in-[0.98] duration-200`}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 id="modal-title" className="text-base font-semibold text-text-1 tracking-tight">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 -mr-1.5 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                        aria-label="Close modal"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
